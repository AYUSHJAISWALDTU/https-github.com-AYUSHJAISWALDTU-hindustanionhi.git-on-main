const Category = require('../models/Category');

/**
 * @desc    Get all categories (admin — includes inactive)
 * @route   GET /api/admin/categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort('name').lean();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create category
 * @route   POST /api/admin/categories
 */
exports.createCategory = async (req, res, next) => {
  try {
    req.body.slug = req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/admin/categories/:id
 */
exports.updateCategory = async (req, res, next) => {
  try {
    if (req.body.name) {
      req.body.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/admin/categories/:id
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
