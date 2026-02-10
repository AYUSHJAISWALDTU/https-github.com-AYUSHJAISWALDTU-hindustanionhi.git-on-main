const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  updateOrderStatus,
  downloadInvoice,
  returnDecision,
  pickupCompleted,
  processRefund,
  getRequests,
  updateShippingStatus,
  markDelivered,
} = require('../controllers/adminOrderController');
const { protectAdmin } = require('../middleware/adminAuth');

router.use(protectAdmin);

router.get('/requests', getRequests);
router.get('/', getOrders);
router.get('/:id/invoice', downloadInvoice);
router.get('/:id', getOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/shipping-status', updateShippingStatus);
router.put('/:id/mark-delivered', markDelivered);
router.put('/:id/return-decision', returnDecision);
router.put('/:id/pickup-completed', pickupCompleted);
router.post('/:id/refund', processRefund);

module.exports = router;
