const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validate, reviewSchema } = require('../middleware/validate');

router.route('/:productId').get(getProductReviews).post(protect, validate(reviewSchema), createReview);
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
