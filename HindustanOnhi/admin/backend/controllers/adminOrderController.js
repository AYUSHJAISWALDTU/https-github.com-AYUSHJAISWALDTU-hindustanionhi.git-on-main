const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Razorpay = require('razorpay');
const { generateInvoice } = require('../utils/invoiceGenerator');
const { sendOrderShippedEmail, sendCancellationEmail, sendRefundEmail } = require('../utils/emailService');
const { logAction } = require('../middleware/auditLog');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Get all orders with filters
 * @route   GET /api/admin/orders
 */
exports.getOrders = async (req, res, next) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') query.orderStatus = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    let ordersQuery = Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const [orders, total] = await Promise.all([
      ordersQuery.lean(),
      Order.countDocuments(query),
    ]);

    // If there's a search term, filter after populate (name/email)
    let filtered = orders;
    if (search) {
      const term = search.toLowerCase();
      filtered = orders.filter(
        (o) =>
          o._id.toString().includes(term) ||
          o.user?.name?.toLowerCase().includes(term) ||
          o.user?.email?.toLowerCase().includes(term)
      );
    }

    res.status(200).json({
      success: true,
      total: search ? filtered.length : total,
      totalPages: Math.ceil((search ? filtered.length : total) / Number(limit)),
      currentPage: Number(page),
      orders: filtered,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order details
 * @route   GET /api/admin/orders/:id
 */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone addresses')
      .populate('orderItems.product', 'name slug images');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/admin/orders/:id/status
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { status, trackingNumber, courier, awbNumber } = req.body;
    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    // Handle shipping details when status is 'shipped'
    if (status === 'shipped') {
      const awb = awbNumber || trackingNumber || '';
      const courierName = courier || 'Blue Dart';
      const trackingUrl = awb
        ? `https://www.bluedart.com/trackdartresultthirdparty?trackFor=0&trackNo=${awb}`
        : '';

      order.shipping = {
        courier: courierName,
        awbNumber: awb,
        status: 'shipped',
        shippedAt: new Date(),
        trackingUrl,
      };
      if (awb) order.trackingNumber = awb;
    }

    if (status === 'delivered') {
      order.deliveredAt = Date.now();
      if (order.shipping) {
        order.shipping.status = 'delivered';
        order.shipping.deliveredAt = new Date();
      }
    }

    if (status === 'cancelled' && !order.isPaid) {
      // Nothing to refund
    }

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('user', 'name email phone');

    // Send shipped email notification with Blue Dart tracking (non-blocking)
    if (status === 'shipped') {
      const user = await User.findById(order.user);
      if (user?.email) {
        sendOrderShippedEmail(user.email, order, user.name);
      }
    }

    await logAction(req, 'UPDATE_ORDER_STATUS', 'Order', req.params.id, `Order status → ${status}`);

    res.status(200).json({ success: true, order: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download invoice PDF for an order
 * @route   GET /api/admin/orders/:id/invoice
 */
exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product', 'name images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const user = await User.findById(order.user);
    const userName = user ? user.name : 'Customer';

    const pdfBuffer = await generateInvoice(order, userName);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${order._id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or reject a return request
 * @route   PUT /api/admin/orders/:id/return-decision
 */
exports.returnDecision = async (req, res, next) => {
  try {
    const { approved } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!order.returnRequest?.requested) {
      return res.status(400).json({ success: false, message: 'No return request found' });
    }

    order.returnRequest.approved = approved;
    order.returnRequest.decidedAt = new Date();

    if (!approved) {
      // Rejected — no further action
      await order.save();
      return res.status(200).json({ success: true, message: 'Return request rejected', order });
    }

    await order.save();
    res.status(200).json({ success: true, message: 'Return approved. Awaiting pickup completion.', order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark pickup completed for a return
 * @route   PUT /api/admin/orders/:id/pickup-completed
 */
exports.pickupCompleted = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!order.returnRequest?.approved) {
      return res.status(400).json({ success: false, message: 'Return not approved yet' });
    }

    order.returnRequest.pickupCompleted = true;
    order.orderStatus = 'returned';

    // Restore stock
    for (const item of order.orderItems) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'sizes.size': item.size },
        { $inc: { 'sizes.$.stock': item.quantity, sold: -item.quantity } }
      );
    }

    // Process refund if paid via Razorpay
    if (order.isPaid && order.paymentMethod === 'razorpay' && order.paymentResult?.razorpay_payment_id) {
      try {
        const refundResult = await razorpay.payments.refund(
          order.paymentResult.razorpay_payment_id,
          { amount: order.totalPrice * 100 }
        );
        order.refund = {
          status: 'completed',
          amount: order.totalPrice,
          razorpayRefundId: refundResult.id,
          refundedAt: new Date(),
        };
        order.paymentResult.status = 'refunded';

        // Send refund email
        const user = await User.findById(order.user);
        if (user?.email) sendRefundEmail(user.email, order, user.name);
      } catch (refundErr) {
        console.error('Razorpay refund failed:', refundErr.message);
        order.refund = { status: 'initiated', amount: order.totalPrice };
      }
    }

    await order.save();

    const populated = await Order.findById(order._id).populate('user', 'name email phone');
    res.status(200).json({ success: true, message: 'Pickup completed & refund processed', order: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Manually process refund for an order
 * @route   POST /api/admin/orders/:id/refund
 */
exports.processRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.refund?.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Refund already completed' });
    }

    if (!order.isPaid || order.paymentMethod !== 'razorpay' || !order.paymentResult?.razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Cannot refund — not a paid Razorpay order' });
    }

    const refundResult = await razorpay.payments.refund(
      order.paymentResult.razorpay_payment_id,
      { amount: order.totalPrice * 100 }
    );

    order.refund = {
      status: 'completed',
      amount: order.totalPrice,
      razorpayRefundId: refundResult.id,
      refundedAt: new Date(),
    };
    order.paymentResult.status = 'refunded';
    await order.save();

    // Send refund email
    const user = await User.findById(order.user);
    if (user?.email) sendRefundEmail(user.email, order, user.name);

    const populated = await Order.findById(order._id).populate('user', 'name email phone');
    res.status(200).json({ success: true, message: 'Refund processed successfully', order: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get orders with pending cancellation/return requests
 * @route   GET /api/admin/orders/requests
 */
exports.getRequests = async (req, res, next) => {
  try {
    const { type } = req.query; // 'cancellation' | 'return' | 'all'

    let query = {};
    if (type === 'cancellation') {
      query = { 'cancellation.requested': true, 'cancellation.approved': null };
    } else if (type === 'return') {
      query = { 'returnRequest.requested': true };
    } else {
      query = {
        $or: [
          { 'cancellation.requested': true },
          { 'returnRequest.requested': true },
        ],
      };
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update shipping / tracking status (in-transit, out-for-delivery, etc.)
 * @route   PUT /api/admin/orders/:id/shipping-status
 */
exports.updateShippingStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { shippingStatus } = req.body;

    if (!['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(shippingStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid shipping status' });
    }

    if (!order.shipping) {
      return res.status(400).json({ success: false, message: 'Order has not been shipped yet' });
    }

    order.shipping.status = shippingStatus;

    if (shippingStatus === 'delivered') {
      order.shipping.deliveredAt = new Date();
      order.orderStatus = 'delivered';
      order.deliveredAt = new Date();
    }

    await order.save();

    const populated = await Order.findById(order._id).populate('user', 'name email phone');
    res.status(200).json({ success: true, order: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark order as delivered via Blue Dart
 * @route   PUT /api/admin/orders/:id/mark-delivered
 */
exports.markDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.orderStatus === 'delivered') {
      return res.status(400).json({ success: false, message: 'Order is already delivered' });
    }

    order.orderStatus = 'delivered';
    order.deliveredAt = new Date();

    if (order.shipping) {
      order.shipping.status = 'delivered';
      order.shipping.deliveredAt = new Date();
    }

    await order.save();

    const populated = await Order.findById(order._id).populate('user', 'name email phone');
    res.status(200).json({ success: true, message: 'Order marked as delivered', order: populated });
  } catch (error) {
    next(error);
  }
};
