const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

/**
 * @desc    Get dashboard overview stats
 * @route   GET /api/admin/dashboard
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOrders,
      revenueAgg,
      pendingOrders,
      recentOrders,
      lowStockProducts,
      totalProducts,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ orderStatus: 'processing' }),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Product.find({ totalStock: { $lte: 5 }, isActive: true })
        .select('name totalStock images price')
        .sort({ totalStock: 1 })
        .limit(10)
        .lean(),
      Product.countDocuments(),
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Orders by status
    const statusBreakdown = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue,
        pendingOrders,
        totalProducts,
        recentOrders,
        lowStockProducts,
        statusBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analytics — sales by date (last 30 days)
 * @route   GET /api/admin/dashboard/sales-by-date
 */
exports.getSalesByDate = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const salesData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill in missing days with 0
    const filled = [];
    const d = new Date(startDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    while (d <= today) {
      const key = d.toISOString().split('T')[0];
      const found = salesData.find((s) => s._id === key);
      filled.push({
        date: key,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0,
      });
      d.setDate(d.getDate() + 1);
    }

    res.status(200).json({ success: true, data: filled });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analytics — top selling products
 * @route   GET /api/admin/dashboard/top-products
 */
exports.getTopProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topProducts = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          productName: { $first: '$orderItems.name' },
          productImage: { $first: '$orderItems.image' },
          totalSold: { $sum: '$orderItems.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);

    res.status(200).json({ success: true, data: topProducts });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analytics — category-wise sales
 * @route   GET /api/admin/dashboard/category-sales
 */
exports.getCategorySales = async (req, res, next) => {
  try {
    const categorySales = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: '$productInfo' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$productInfo.category',
          categoryName: { $first: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] } },
          totalSold: { $sum: '$orderItems.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json({ success: true, data: categorySales });
  } catch (error) {
    next(error);
  }
};
