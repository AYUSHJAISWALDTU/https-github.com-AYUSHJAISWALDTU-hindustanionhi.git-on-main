const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect admin routes — require valid JWT
 */
const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — admin login required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Admin user not found' });
    }

    // Strict admin-only check
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied — admins only' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

module.exports = { protectAdmin };
