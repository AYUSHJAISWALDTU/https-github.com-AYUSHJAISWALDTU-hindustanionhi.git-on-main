const AuditLog = require('../models/AuditLog');

/**
 * @desc    Get audit logs with filters & pagination
 * @route   GET /api/admin/audit-logs
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, action, entity, adminId } = req.query;
    const query = {};

    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (adminId) query.adminId = adminId;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('adminId', 'name email')
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get audit log stats
 * @route   GET /api/admin/audit-logs/stats
 */
exports.getAuditStats = async (req, res, next) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [byAction, byAdmin, recentCount] = await Promise.all([
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: last24h } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLog.aggregate([
        { $match: { createdAt: { $gte: last24h } } },
        { $group: { _id: '$adminEmail', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AuditLog.countDocuments({ createdAt: { $gte: last24h } }),
    ]);

    res.status(200).json({
      success: true,
      stats: { recentCount, byAction, byAdmin },
    });
  } catch (error) {
    next(error);
  }
};
