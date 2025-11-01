// src/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

/* NEW: trust proxy for Render/load balancers
   Configure via env; start with 1 hop and adjust if needed. */
const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS || '1');
app.set('trust proxy', TRUST_PROXY_HOPS);

/* Optional: quick diagnostics to find the correct hop count.
   Remove after verifying. */
app.get('/ip', (req, res) => {
  res.json({ ip: req.ip, ips: req.ips });
});

app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(helmet());

/* Rate limit — keep defaults once trust proxy is correct.
   If the validation error persists during rollout, flip the flag below to false as a temporary workaround. */
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: true  // set to false only if the error persists temporarily
  }
});
app.use(limiter);

// Routes
const chatRoutes = require('./routes/chat');
const ytRoutes = require('./routes/youtube');
const gbRoutes = require('./routes/gutenberg');
const recRoutes = require('./routes/recommend');
const healthRoutes = require('./routes/health');

app.use('/api', chatRoutes);
app.use('/api', ytRoutes);
app.use('/api', gbRoutes);
app.use('/api', recRoutes);
app.use('/', healthRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API running on :${PORT}, trust proxy hops: ${TRUST_PROXY_HOPS}`);
});
