const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const Sentry = require('@sentry/node');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// ===========================
// Sentry Error Monitoring
// ===========================
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
  console.log('📡 Sentry error monitoring initialized');
}

// Connect to database
connectDB();

const app = express();

// ===========================
// Security & Performance
// ===========================
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression());

// Trust proxy (for correct IP in rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// General rate limiting — 200 requests per 15 min
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints — 20 requests per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes' },
});

// ===========================
// Body Parsing & CORS
// ===========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// ===========================
// API Routes
// ===========================
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/chatbot', require('./routes/chatbotRoutes'));
app.use('/api', require('./routes/seoRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HindustanOnhi API is running 🪷', timestamp: new Date() });
});

// ===========================
// Error Handler (must be last)
// ===========================
app.use(errorHandler);

// ===========================
// Start Server
// ===========================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🪷 HindustanOnhi API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
