const mongoose = require('mongoose');

/**
 * Order Schema
 * Tracks customer orders, payment, and delivery status
 */
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: String,
  image: String,
  size: String,
  color: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod'],
      default: 'razorpay',
    },
    paymentResult: {
      razorpay_order_id: String,
      razorpay_payment_id: String,
      razorpay_signature: String,
      status: String,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    orderStatus: {
      type: String,
      enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'processing',
    },
    deliveredAt: Date,
    trackingNumber: String,

    /* ─── Shipping / Blue Dart ─── */
    shipping: {
      courier: { type: String, default: 'Blue Dart' },
      awbNumber: String,
      status: {
        type: String,
        enum: ['pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'],
        default: 'pending',
      },
      shippedAt: Date,
      deliveredAt: Date,
      trackingUrl: String,
    },

    /* ─── Cancellation ─── */
    cancellation: {
      requested: { type: Boolean, default: false },
      reason: String,
      requestedAt: Date,
      approved: { type: Boolean, default: null },   // null = pending, true/false = decision
      decidedAt: Date,
    },

    /* ─── Return ─── */
    returnRequest: {
      requested: { type: Boolean, default: false },
      reason: String,
      requestedAt: Date,
      approved: { type: Boolean, default: null },
      decidedAt: Date,
      pickupCompleted: { type: Boolean, default: false },
    },

    /* ─── Refund ─── */
    refund: {
      status: {
        type: String,
        enum: ['none', 'initiated', 'completed'],
        default: 'none',
      },
      amount: Number,
      razorpayRefundId: String,
      refundedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
