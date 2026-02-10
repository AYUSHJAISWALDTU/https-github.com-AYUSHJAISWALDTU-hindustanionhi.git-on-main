const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getProducts).post(protect, authorize('admin'), createProduct);
router.get('/id/:id', getProductById);
router.get('/:id/related', getRelatedProducts);
router
  .route('/:id')
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);
// Slug-based route — must be last to avoid conflicts
router.get('/slug/:slug', getProduct);

module.exports = router;
