const express = require('express');
const router = express.Router();
const { searchBooks, listSubjects } = require('../utils/gutenberg');

// GET /api/books?q=...&page_size=10&page=1
router.get('/books', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const page_size = Math.min(parseInt(req.query.page_size || '10', 10), 50);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    if (!q) return res.status(400).json({ error: 'q is required' });

    const data = await searchBooks({ q, page_size, page });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/subjects
router.get('/subjects', async (req, res) => {
  try {
    const data = await listSubjects();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
