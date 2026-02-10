const Sentry = require('@sentry/node');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') { statusCode = 400; message = 'Resource not found'; }
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for '${field}'`;
  }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((v) => v.message).join(', ');
  }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired'; }

  // Report 5xx errors to Sentry
  if (statusCode >= 500 && process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      extra: {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        adminId: req.user?._id?.toString(),
      },
    });
  }

  console.error('❌ Admin Error:', err.message);
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
