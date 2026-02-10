const Product = require('../models/Product');

/**
 * @desc    Get all products with filtering, sorting, pagination
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      sizes,
      colors,
      fabric,
      occasion,
      sort,
      search,
      page = 1,
      limit = 12,
      featured,
    } = req.query;

    // Build query
    const query = { isActive: true };

    if (category) query.category = category;
    if (fabric) query.fabric = { $regex: fabric, $options: 'i' };
    if (occasion) query.occasion = occasion;
    if (featured === 'true') query.isFeatured = true;

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Size filter
    if (sizes) {
      const sizeArr = sizes.split(',');
      query['sizes.size'] = { $in: sizeArr };
    }

    // Color filter
    if (colors) {
      const colorArr = colors.split(',');
      query['colors.name'] = { $in: colorArr.map((c) => new RegExp(c, 'i')) };
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default: newest
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'popular') sortOption = { sold: -1 };
    else if (sort === 'rating') sortOption = { ratingsAverage: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by slug
 * @route   GET /api/products/:slug
 * @access  Public
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate('category', 'name slug')
      .populate('styleWith', 'name slug images price comparePrice ratingsAverage ratingsCount');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get product by ID
 * @route   GET /api/products/id/:id
 * @access  Public
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create product (Admin)
 * @route   POST /api/products
 * @access  Private/Admin
 */
exports.createProduct = async (req, res, next) => {
  try {
    // Generate slug from name
    req.body.slug = req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product (Admin)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product (Admin)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get related products
 * @route   GET /api/products/:id/related
 * @access  Public
 */
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(8)
      .populate('category', 'name slug');

    res.status(200).json({ success: true, products: related });
  } catch (error) {
    next(error);
  }
};
