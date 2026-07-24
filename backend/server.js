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
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline scripts, WebGL, and MediaPipe CDN WASM
    crossOriginEmbedderPolicy: false,
  })
);

/* ── CORS ── */
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

/* ── Body parser ── */
app.use(express.json({ limit: '10mb' }));

app.set('trust proxy', 1);

/* ── Rate limiting on auth routes (prevent brute force) ── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many authentication attempts, please try again later.' },
});

/* ── Routes ── */
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api/gestures', gestureRoutes);

/* ── Health check ── */
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

/* ── Production static files ── */
const buildPath = path.join(__dirname, '../build');
if (process.env.NODE_ENV === 'production') {
  console.log('[Production] Serving static files from:', buildPath);
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

/* ── Listen on 0.0.0.0 for Render proxy ── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AccessAble backend server running on port ${PORT} (host 0.0.0.0)`);
});