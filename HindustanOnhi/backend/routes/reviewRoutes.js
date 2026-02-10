const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.route('/:productId').get(getProductReviews).post(protect, createReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
