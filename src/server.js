const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Basic middleware
app.use(express.json({ limit: '1mb' }));
app.use(cors()); // allow all origins by default
app.use(helmet());

// Global rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120
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
  console.log(`API running on :${PORT}`);
});
