const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const Sentry = require('@sentry/node');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

// ── Sentry Error Monitoring ──
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
  console.log('📡 Sentry error monitoring initialized');
}

connectDB();

const app = express();

// Ensure DB connection on every request (for Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// ── Security ──
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression());
app.set('trust proxy', 1);

// General rate limiting — 300 requests per 15 min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests' },
});
app.use('/api/', limiter);

// Stricter auth rate limiting — 15 attempts per 15 min
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes' },
});

// ── Parsing & CORS ──
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Build allowed origins list
const allowedOrigins = [
  process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174',
  'http://localhost:5174',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in initial deployment; tighten later
      }
    },
    credentials: true,
  })
);

// ── Static uploads ──
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Admin API Routes ──
app.use('/api/admin/auth', adminAuthLimiter, require('./routes/authRoutes'));
app.use('/api/admin/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin/products', require('./routes/productRoutes'));
app.use('/api/admin/orders', require('./routes/orderRoutes'));
app.use('/api/admin/users', require('./routes/userRoutes'));
app.use('/api/admin/carts', require('./routes/cartRoutes'));
app.use('/api/admin/categories', require('./routes/categoryRoutes'));
app.use('/api/admin/audit-logs', require('./routes/auditLogRoutes'));

// ── Health check ──
app.get('/api/admin/health', (req, res) => {
  res.json({ success: true, message: 'HindustanOnhi Admin API is running 🛡️' });
});

// ── Error handler ──
app.use(errorHandler);

// ── Start (only when not on Vercel) ──
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5002;
  const server = app.listen(PORT, () => {
    console.log(`\n🛡️  HindustanOnhi Admin API running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Admin Frontend: ${process.env.ADMIN_FRONTEND_URL || 'http://localhost:5174'}\n`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
}

// Export for Vercel serverless
module.exports = app;
