const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS || '1');
app.set('trust proxy', TRUST_PROXY_HOPS);

// Diagnostics (optional)
app.get('/ip', (req, res) => res.json({ ip: req.ip, ips: req.ips }));

app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: true }
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
  console.log(`API running on :${PORT} (trust proxy hops=${TRUST_PROXY_HOPS})`);
});
