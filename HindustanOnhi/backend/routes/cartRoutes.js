const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
const { validate, addToCartSchema, updateCartItemSchema } = require('../middleware/validate');

router.route('/').get(protect, getCart).post(protect, validate(addToCartSchema), addToCart).delete(protect, clearCart);
router.route('/:itemId').put(protect, validate(updateCartItemSchema), updateCartItem).delete(protect, removeFromCart);

module.exports = router;
