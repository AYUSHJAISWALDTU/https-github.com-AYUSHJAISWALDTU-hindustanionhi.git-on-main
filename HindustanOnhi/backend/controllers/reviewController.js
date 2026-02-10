const Review = require('../models/Review');
const Product = require('../models/Product');

/**
 * @desc    Get reviews for a product
 * @route   GET /api/reviews/:productId
 * @access  Public
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update a review
 * @route   POST /api/reviews/:productId
 * @access  Private
 */
exports.createReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    const productId = req.params.productId;

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.title = title;
      existingReview.comment = comment;
      await existingReview.save();
      return res.status(200).json({ success: true, review: existingReview });
    }

    // Create new review
    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      title,
      comment,
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private
 */
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Only owner or admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
