const AuditLog = require('../models/AuditLog');

/**
 * Log an admin action to the audit trail
 * @param {Object} req     Express request (must have req.user)
 * @param {String} action  Action name (e.g. 'CREATE_PRODUCT')
 * @param {String} entity  Entity type (e.g. 'Product')
 * @param {String} entityId  ID of the entity affected
 * @param {String} details  Human-readable summary
 */
const logAction = async (req, action, entity, entityId = '', details = '') => {
  try {
    await AuditLog.create({
      adminId: req.user?._id || req.user?.id,
      adminEmail: req.user?.email || '',
      action,
      entity,
      entityId: String(entityId),
      details,
      ip: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    });
  } catch (err) {
    console.error('⚠️ Audit log write failed:', err.message);
    // Don't throw — audit failures should never block business logic
  }
};

module.exports = { logAction };
