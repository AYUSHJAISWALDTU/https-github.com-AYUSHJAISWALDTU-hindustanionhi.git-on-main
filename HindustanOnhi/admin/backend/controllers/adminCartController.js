const Cart = require('../models/Cart');

/**
 * @desc    Get all active carts
 * @route   GET /api/admin/carts
 */
exports.getCarts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, abandoned } = req.query;
    const query = { 'items.0': { $exists: true } }; // only non-empty carts

    const skip = (Number(page) - 1) * Number(limit);

    let cartsQuery = Cart.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images price')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const [carts, total] = await Promise.all([
      cartsQuery.lean(),
      Cart.countDocuments(query),
    ]);

    // Flag abandoned carts (no update in 24 hours)
    const now = Date.now();
    const enriched = carts.map((c) => ({
      ...c,
      isAbandoned: now - new Date(c.updatedAt).getTime() > 24 * 60 * 60 * 1000,
    }));

    let result = enriched;
    if (abandoned === 'true') {
      result = enriched.filter((c) => c.isAbandoned);
    } else if (abandoned === 'false') {
      result = enriched.filter((c) => !c.isAbandoned);
    }

    res.status(200).json({
      success: true,
      total: result.length,
      totalPages: Math.ceil(result.length / Number(limit)),
      currentPage: Number(page),
      carts: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear a user's cart (admin)
 * @route   DELETE /api/admin/carts/:cartId
 */
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.cartId);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = [];
    await cart.save();
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};
