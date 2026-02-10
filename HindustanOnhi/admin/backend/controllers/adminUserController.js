const User = require('../models/User');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') query.role = role;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/admin/users/:id
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle block/unblock user
 * @route   PUT /api/admin/users/:id/block
 */
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block admin accounts' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isBlocked ? 'User blocked' : 'User unblocked',
      user: { _id: user._id, isBlocked: user.isBlocked },
    });
  } catch (error) {
    next(error);
  }
};
