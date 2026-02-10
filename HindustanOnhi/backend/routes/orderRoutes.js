const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  getRazorpayKey,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.get('/razorpay-key', getRazorpayKey);
router.route('/').post(protect, createOrder).get(protect, authorize('admin'), getAllOrders);
router.get('/my', protect, getMyOrders);
router.post('/verify-payment', protect, verifyPayment);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;
