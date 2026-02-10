const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/adminCategoryController');
const { protectAdmin } = require('../middleware/adminAuth');

router.use(protectAdmin);

router.route('/').get(getCategories).post(createCategory);
router.route('/:id').put(updateCategory).delete(deleteCategory);

module.exports = router;
