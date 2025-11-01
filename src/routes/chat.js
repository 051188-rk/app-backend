const express = require('express');
const router = express.Router();
const { streamCompletion, completeOnce } = require('../utils/groq');
const { expansions } = require('../utils/nlp');
const { searchYouTube } = require('../utils/youtube');
const { searchBooks } = require('../utils/gutenberg');
const { dedupeBy } = require('../utils/dedupe');

// Helper to fetch recommendations in parallel
async function fetchRecommendations(q) {
  const variants = expansions(q);
  // YouTube: gather across variants then dedupe to 4
  const videoBatches = await Promise.all(
    variants.map(v => searchYouTube({ q: v, maxResults: 5 }))
  );
  const videos = dedupeBy(videoBatches.flat(), v => v.videoId).slice(0, 4);

  // Gutenberg: take first 4
  const gb = await searchBooks({ q, page_size: 10, page: 1 });
  const books = Array.isArray(gb?.results) ? gb.results.slice(0, 4) : [];

  return { variants, videos, books };
}

// POST /api/chat
// body: { message: string, history?: [{role, content}], stream?: boolean, includeRecs?: boolean, temperature?: number }
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      stream = true,
      includeRecs = true,
      temperature = 0.6
    } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    // Non-stream JSON response
    if (!stream) {
      const text = await completeOnce({ message, history, temperature });
      // Optionally attach recs in non-stream mode
      let recs = null;
      if (includeRecs) {
        try {
          recs = await fetchRecommendations(message);
        } catch (e) {
          recs = { error: e.message };
        }
      }
      return res.json({ text, recs });
    }

    // Streaming via SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Kick off chat stream
    const groqStream = await streamCompletion({ message, history, temperature });

    // Kick off recommendations in parallel if requested
    const recPromise = includeRecs ? fetchRecommendations(message).catch(err => ({ error: err.message })) : null;

    // Optional keep-alive ping every 15s (some proxies like it)
    const ka = setInterval(() => {
      res.write('event: ping\ndata: {}\n\n');
    }, 15000);

    let full = '';
    let recsSent = false;

    const maybeSendRecs = async () => {
      if (recPromise && !recsSent) {
        const r = await recPromise;
        recsSent = true;
        res.write(`event: recs\ndata: ${JSON.stringify(r)}\n\n`);
      }
    };

    try {
      // As tokens arrive, stream them down
      for await (const chunk of groqStream) {
        const token = chunk?.choices?.[0]?.delta?.content || '';
        if (token) {
          full += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
        // If recommendations are ready, send them early
        if (recPromise) {
          if (typeof recPromise.then === 'function') {
            // Non-blocking check
            // Note: no native non-blocking "peek", so rely on sending when awaited at done or when stream yields
          }
        }
      }

      // Try to send recs now if not yet sent
      await maybeSendRecs();

      // Final done event with full text
      res.write(`event: done\ndata: ${JSON.stringify({ text: full })}\n\n`);
      clearInterval(ka);
      res.end();
    } catch (inner) {
      // Attempt to send any available recs even on error
      try { await maybeSendRecs(); } catch (_) {}
      clearInterval(ka);
      res.write(`event: error\ndata: ${JSON.stringify({ error: inner.message })}\n\n`);
      res.end();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
