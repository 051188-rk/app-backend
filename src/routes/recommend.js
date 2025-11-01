const express = require('express');
const router = express.Router();
const { expansions } = require('../utils/nlp');
const { searchYouTube } = require('../utils/youtube');
const { searchBooks } = require('../utils/gutenberg');
const { dedupeBy } = require('../utils/dedupe');

// GET /api/recommend?q=topic
router.get('/recommend', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'q is required' });

    // Expand query for better recall
    const queries = expansions(q);

    // Search YouTube across expansions, then dedupe by videoId
    const videoBatches = await Promise.all(
      queries.map(v => searchYouTube({ q: v, maxResults: 5 }))
    );
    const allVideos = videoBatches.flat();
    const uniqueVideos = dedupeBy(allVideos, v => v.videoId).slice(0, 4);

    // Search Gutenberg
    const gb = await searchBooks({ q, page_size: 10, page: 1 });
    const topBooks = Array.isArray(gb?.results) ? gb.results.slice(0, 4) : [];

    res.json({
      query: q,
      variants: queries,
      videos: uniqueVideos,
      books: topBooks
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
