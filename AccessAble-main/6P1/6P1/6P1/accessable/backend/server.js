const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const dotenv    = require('dotenv');
const connectDB = require('./config/db');
const authRoutes    = require('./routes/auth');
const gestureRoutes = require('./routes/gesture');

dotenv.config();
connectDB();

const app = express();

/* ── Security headers (helmet) ── */
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow webcam/media APIs in dev
}));

/* ── CORS ── */
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || 'http://localhost:3000'
    : 'http://localhost:3000',
  credentials: true,
}));

/* ── Body parser ── */
app.use(express.json({ limit: '1mb' }));

app.set('trust proxy', 1);

/* ── Rate limiting on auth routes (prevent brute force) ── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many authentication attempts, please try again later.' },
});

/* ── Routes ── */
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/gestures', gestureRoutes);

/* ── Health check ── */
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

/* ── Production static files ── */
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../build', 'index.html'))
  );
}

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`AccessAble backend running on port ${PORT}`));