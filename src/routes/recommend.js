const express = require('express');
const router = express.Router();
const { searchYouTube } = require('../utils/youtube');
const { searchBooks } = require('../utils/gutenberg');
const { dedupeBy } = require('../utils/dedupe');
const py = require('../utils/python_nlp');

// GET /api/recommend?q=topic
router.get('/recommend', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'q is required' });

    // 1) NLP expansions
    const { expansions } = await py.analyze(q);

    // 2) Gather candidates
    const videoBatches = await Promise.all(
      expansions.map(e => searchYouTube({ q: e, maxResults: 6 }))
    );
    const allVideos = dedupeBy(videoBatches.flat(), v => v.videoId);

    const gb = await searchBooks({ q, page_size: 20, page: 1 });
    const allBooks = Array.isArray(gb?.results) ? gb.results : [];

    // 3) Score with Python (cosine to query)
    const videoItems = allVideos.map(v => ({
      id: v.videoId,
      text: `${v.title || ''} ${v.description || ''} ${v.channelTitle || ''}`
    }));
    const bookItems = allBooks.map(b => ({
      id: String(b.id ?? ''),
      text: `${b.title || ''} ${(b.authors || []).map(a => a.name).join(' ')} ${(b.subjects || []).join(' ')}`
    }));

    const [vScores, bScores] = await Promise.all([
      py.score(q, videoItems),
      py.score(q, bookItems)
    ]);

    // 4) Rank and select tops
    const rankedVideos = allVideos
      .map((v, i) => ({ v, s: vScores.scores[i] ?? 0 }))
      .sort((a, b) => (b.s - a.s))
      .slice(0, 4)
      .map(x => x.v);

    const rankedBooks = allBooks
      .map((b, i) => ({ b, s: bScores.scores[i] ?? 0 }))
      .sort((a, b) => (b.s - a.s))
      .slice(0, 4)
      .map(x => x.b);

    res.json({
      query: q,
      variants: expansions,
      videos: rankedVideos,
      books: rankedBooks
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
