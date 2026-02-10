const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  logout,
  getMe,
  updateProfile,
  updateAddress,
  deleteAddress,
  toggleWishlist,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validate,
  registerSchema,
  loginSchema,
  googleLoginSchema,
  updateProfileSchema,
  addressSchema,
} = require('../middleware/validate');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleLoginSchema), googleLogin);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.put('/address', protect, validate(addressSchema), updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.put('/wishlist/:productId', protect, toggleWishlist);

module.exports = router;
