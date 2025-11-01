const express = require('express');
const router = express.Router();
const { searchYouTube } = require('../utils/youtube');

// GET /api/videos?q=topic&maxResults=4
router.get('/videos', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const maxResults = Math.min(parseInt(req.query.maxResults || '4', 10), 10);
    if (!q) return res.status(400).json({ error: 'q is required' });
    const results = await searchYouTube({ q, maxResults });
    res.json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
