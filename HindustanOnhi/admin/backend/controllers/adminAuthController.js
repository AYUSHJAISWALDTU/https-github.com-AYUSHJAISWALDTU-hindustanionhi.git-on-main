const User = require('../models/User');
const { logAction } = require('../middleware/auditLog');

/**
 * @desc    Admin login
 * @route   POST /api/admin/auth/login
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Strict admin check
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied — not an admin account' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = user.getSignedJwtToken();

    const cookieOptions = {
      expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    res.status(200).cookie('admin_token', token, cookieOptions).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });

    // Log after response (non-blocking)
    logAction({ user, ip: req.ip, headers: req.headers }, 'LOGIN', 'Auth', user._id, `Admin login: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin logout
 * @route   POST /api/admin/auth/logout
 */
exports.adminLogout = async (req, res) => {
  await logAction(req, 'LOGOUT', 'Auth', req.user?._id, `Admin logout: ${req.user?.email}`);

  res.cookie('admin_token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out' });
};

/**
 * @desc    Get current admin
 * @route   GET /api/admin/auth/me
 */
exports.getAdminMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};
