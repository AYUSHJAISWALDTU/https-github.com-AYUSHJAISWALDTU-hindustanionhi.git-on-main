const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getSalesByDate,
  getTopProducts,
  getCategorySales,
} = require('../controllers/dashboardController');
const { protectAdmin } = require('../middleware/adminAuth');

router.use(protectAdmin); // all routes below are admin-only

router.get('/', getDashboard);
router.get('/sales-by-date', getSalesByDate);
router.get('/top-products', getTopProducts);
router.get('/category-sales', getCategorySales);

module.exports = router;
