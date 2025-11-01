const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ ok: true }));
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
