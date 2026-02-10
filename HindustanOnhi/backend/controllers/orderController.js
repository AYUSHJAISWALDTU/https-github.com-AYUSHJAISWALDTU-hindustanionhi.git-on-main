const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendOrderConfirmationEmail, sendOrderShippedEmail } = require('../utils/emailService');
const { generateInvoice } = require('../utils/invoiceGenerator');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'razorpay' } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Build order items
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0]?.url || '',
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.price,
    }));

    // Calculate prices
    const itemsPrice = cart.totalPrice;
    const shippingPrice = itemsPrice > 999 ? 0 : 99; // Free shipping over ₹999
    const taxPrice = Math.round(itemsPrice * 0.05); // 5% GST
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: paymentMethod === 'cod' ? false : false,
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'processing',
    });

    // If Razorpay, create Razorpay order
    if (paymentMethod === 'razorpay') {
      const razorpayOrder = await razorpay.orders.create({
        amount: totalPrice * 100, // paise
        currency: 'INR',
        receipt: order._id.toString(),
        notes: {
          orderFor: req.user.name,
          email: req.user.email,
        },
      });

      order.paymentResult = {
        razorpay_order_id: razorpayOrder.id,
        status: 'created',
      };
      await order.save();

      // Clear cart
      cart.items = [];
      await cart.save();

      return res.status(201).json({
        success: true,
        order,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    // COD — clear cart and return
    cart.items = [];
    await cart.save();

    // Decrease product stock
    for (const item of orderItems) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'sizes.size': item.size },
        {
          $inc: {
            'sizes.$.stock': -item.quantity,
            sold: item.quantity,
          },
        }
      );
    }

    // Send order confirmation email for COD (non-blocking)
    sendOrderConfirmationEmail(req.user.email, order, req.user.name);

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify Razorpay payment
 * @route   POST /api/orders/verify-payment
 * @access  Private
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'confirmed';
    order.paymentResult = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: 'completed',
    };

    await order.save();

    // Decrease product stock
    for (const item of order.orderItems) {
      await Product.findOneAndUpdate(
        { _id: item.product, 'sizes.size': item.size },
        {
          $inc: {
            'sizes.$.stock': -item.quantity,
            sold: item.quantity,
          },
        }
      );
    }

    // Send order confirmation email (non-blocking)
    const user = await User.findById(order.user);
    if (user?.email) {
      sendOrderConfirmationEmail(user.email, order, user.name);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders/my
 * @access  Private
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name slug images');

    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'orderItems.product',
      'name slug images'
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only allow owner or admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.orderStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

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

    await order.save();

    // Send shipped email notification with Blue Dart tracking (non-blocking)
    if (status === 'shipped') {
      const user = await User.findById(order.user);
      if (user?.email) {
        sendOrderShippedEmail(user.email, order, user.name);
      }
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get shipping / tracking info for an order
 * @route   GET /api/orders/:id/track
 * @access  Private
 */
exports.trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).select(
      'orderStatus shipping trackingNumber deliveredAt createdAt'
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      tracking: {
        orderStatus: order.orderStatus,
        shipping: order.shipping || null,
        trackingNumber: order.trackingNumber || null,
        deliveredAt: order.deliveredAt || null,
        orderedAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Razorpay key
 * @route   GET /api/orders/razorpay-key
 * @access  Public
 */
exports.getRazorpayKey = async (req, res, next) => {
  res.status(200).json({ success: true, key: process.env.RAZORPAY_KEY_ID });
};

/**
 * @desc    Download invoice PDF for an order
 * @route   GET /api/orders/:id/invoice
 * @access  Private
 */
exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('orderItems.product', 'name images');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only the order owner can download the invoice
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to download this invoice' });
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
 * @desc    Request order cancellation (before shipped)
 * @route   POST /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only order owner
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Can only cancel before shipped
    if (['shipped', 'delivered', 'cancelled', 'returned'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel — order is already ${order.orderStatus}`,
      });
    }

    // Already requested
    if (order.cancellation?.requested) {
      return res.status(400).json({ success: false, message: 'Cancellation already requested' });
    }

    order.cancellation = {
      requested: true,
      reason: req.body.reason || 'No reason provided',
      requestedAt: new Date(),
      approved: null,
    };

    // For COD or unpaid orders, auto-approve cancellation
    if (!order.isPaid) {
      order.cancellation.approved = true;
      order.cancellation.decidedAt = new Date();
      order.orderStatus = 'cancelled';

      // Restore stock
      for (const item of order.orderItems) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'sizes.size': item.size },
          { $inc: { 'sizes.$.stock': item.quantity, sold: -item.quantity } }
        );
      }
    } else {
      // Paid order — auto-approve and initiate refund
      order.cancellation.approved = true;
      order.cancellation.decidedAt = new Date();
      order.orderStatus = 'cancelled';

      // Restore stock
      for (const item of order.orderItems) {
        await Product.findOneAndUpdate(
          { _id: item.product, 'sizes.size': item.size },
          { $inc: { 'sizes.$.stock': item.quantity, sold: -item.quantity } }
        );
      }

      // Initiate Razorpay refund if paid via Razorpay
      if (order.paymentMethod === 'razorpay' && order.paymentResult?.razorpay_payment_id) {
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
        } catch (refundErr) {
          console.error('Razorpay refund failed:', refundErr.message);
          order.refund = { status: 'initiated', amount: order.totalPrice };
        }
      }
    }

    await order.save();

    // Send cancellation email (non-blocking)
    const { sendCancellationEmail } = require('../utils/emailService');
    const user = await User.findById(order.user);
    if (user?.email) sendCancellationEmail(user.email, order, user.name);

    res.status(200).json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request return (after delivered, within 2 days)
 * @route   POST /api/orders/:id/return
 * @access  Private
 */
exports.returnOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Return only allowed for delivered orders' });
    }

    // Check 2-day return window
    const deliveredAt = new Date(order.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = (now - deliveredAt) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 2) {
      return res.status(400).json({
        success: false,
        message: 'Return window expired. Returns allowed within 2 days of delivery.',
      });
    }

    if (order.returnRequest?.requested) {
      return res.status(400).json({ success: false, message: 'Return already requested' });
    }

    order.returnRequest = {
      requested: true,
      reason: req.body.reason || 'No reason provided',
      requestedAt: new Date(),
      approved: null,
      pickupCompleted: false,
    };

    await order.save();

    res.status(200).json({ success: true, message: 'Return request submitted', order });
  } catch (error) {
    next(error);
  }
};
