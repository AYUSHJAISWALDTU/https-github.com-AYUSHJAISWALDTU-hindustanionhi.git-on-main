const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminEmail: {
    type: String,
    default: '',
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'CREATE_PRODUCT',
      'UPDATE_PRODUCT',
      'DELETE_PRODUCT',
      'TOGGLE_PRODUCT_ACTIVE',
      'UPLOAD_PRODUCT_IMAGES',
      'DELETE_PRODUCT_IMAGE',
      'UPDATE_ORDER_STATUS',
      'CANCEL_ORDER',
      'REFUND_ORDER',
      'CREATE_CATEGORY',
      'UPDATE_CATEGORY',
      'DELETE_CATEGORY',
      'UPDATE_USER_ROLE',
      'BLOCK_USER',
      'UNBLOCK_USER',
    ],
  },
  entity: {
    type: String,
    required: true,
    enum: ['Auth', 'Product', 'Order', 'Category', 'User'],
  },
  entityId: {
    type: String,
    default: '',
  },
  details: {
    type: String,
    default: '',
  },
  ip: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Auto-expire logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
