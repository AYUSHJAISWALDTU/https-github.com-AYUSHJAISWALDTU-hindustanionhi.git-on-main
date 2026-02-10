const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updateAddress,
  deleteAddress,
  toggleWishlist,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/address', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.put('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
