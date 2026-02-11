const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleActive,
  uploadImages,
  deleteImage,
} = require('../controllers/adminProductController');
const { protectAdmin } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

router.use(protectAdmin);

// Wrapper to handle multer errors
const handleUpload = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return upload.errorHandler(err, req, res, next);
    }
    next();
  });
};

router
  .route('/')
  .get(getProducts)
  .post(handleUpload(upload.array('imageFiles', 8)), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(handleUpload(upload.array('imageFiles', 8)), updateProduct)
  .delete(deleteProduct);

router.put('/:id/toggle-active', toggleActive);
router.post('/:id/images', handleUpload(upload.array('imageFiles', 8)), uploadImages);
router.delete('/:id/images/:imageId', deleteImage);

module.exports = router;
