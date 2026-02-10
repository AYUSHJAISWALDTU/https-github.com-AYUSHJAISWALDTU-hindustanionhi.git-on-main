const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const { logAction } = require('../middleware/auditLog');

/**
 * Upload a single buffer to Cloudinary and return { url, public_id, alt }
 */
const uploadToCloudinary = (fileBuffer, folder = 'hindustanonhi/products') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary by public_id
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

/**
 * @desc    Get all products (admin — includes inactive)
 * @route   GET /api/admin/products
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, sort, page = 1, limit = 20, active } = req.query;
    const query = {};

    if (category) query.category = category;
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;
    if (search) query.$text = { $search: search };

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    if (sort === 'stock') sortOption = { totalStock: 1 };
    if (sort === 'sold') sortOption = { sold: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
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
 * @desc    Get single product
 * @route   GET /api/admin/products/:id
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug').populate('styleWith', 'name slug images price comparePrice');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create product
 * @route   POST /api/admin/products
 */
exports.createProduct = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Generate slug
    data.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);

    // Parse JSON fields if sent as strings (multipart form)
    if (typeof data.sizes === 'string') data.sizes = JSON.parse(data.sizes);
    if (typeof data.colors === 'string') data.colors = JSON.parse(data.colors);
    if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
    if (typeof data.images === 'string') data.images = JSON.parse(data.images);
    if (typeof data.sizeChart === 'string') data.sizeChart = JSON.parse(data.sizeChart);
    if (typeof data.fabricDetails === 'string') data.fabricDetails = JSON.parse(data.fabricDetails);
    if (typeof data.styleWith === 'string') data.styleWith = JSON.parse(data.styleWith);
    if (typeof data.modelInfo === 'string') data.modelInfo = JSON.parse(data.modelInfo);

    // Handle uploaded files → Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((f) => uploadToCloudinary(f.buffer));
      const results = await Promise.all(uploadPromises);
      const uploaded = results.map((r) => ({
        url: r.url,
        public_id: r.public_id,
        alt: data.name,
      }));
      data.images = [...(data.images || []), ...uploaded];
    }

    const product = await Product.create(data);
    const populated = await Product.findById(product._id).populate('category', 'name slug').populate('styleWith', 'name slug images price comparePrice');

    await logAction(req, 'CREATE_PRODUCT', 'Product', product._id, `Created product: ${product.name}`);

    res.status(201).json({ success: true, product: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/admin/products/:id
 */
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const data = { ...req.body };

    if (typeof data.sizes === 'string') data.sizes = JSON.parse(data.sizes);
    if (typeof data.colors === 'string') data.colors = JSON.parse(data.colors);
    if (typeof data.tags === 'string') data.tags = JSON.parse(data.tags);
    if (typeof data.images === 'string') data.images = JSON.parse(data.images);
    if (typeof data.sizeChart === 'string') data.sizeChart = JSON.parse(data.sizeChart);
    if (typeof data.fabricDetails === 'string') data.fabricDetails = JSON.parse(data.fabricDetails);
    if (typeof data.styleWith === 'string') data.styleWith = JSON.parse(data.styleWith);
    if (typeof data.modelInfo === 'string') data.modelInfo = JSON.parse(data.modelInfo);

    // Handle uploaded files → Cloudinary
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((f) => uploadToCloudinary(f.buffer));
      const results = await Promise.all(uploadPromises);
      const uploaded = results.map((r) => ({
        url: r.url,
        public_id: r.public_id,
        alt: data.name || product.name,
      }));
      data.images = [...(data.images || product.images || []), ...uploaded];
    }

    // Recalc total stock
    if (data.sizes) {
      data.totalStock = data.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
    }

    product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug').populate('styleWith', 'name slug images price comparePrice');

    await logAction(req, 'UPDATE_PRODUCT', 'Product', req.params.id, `Updated product: ${product.name}`);

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/admin/products/:id
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Remove images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images
        .filter((img) => img.public_id)
        .map((img) => deleteFromCloudinary(img.public_id));
      await Promise.all(deletePromises);
    }

    await Product.findByIdAndDelete(req.params.id);

    await logAction(req, 'DELETE_PRODUCT', 'Product', req.params.id, `Deleted product: ${product.name}`);

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle product visibility
 * @route   PUT /api/admin/products/:id/toggle-active
 */
exports.toggleActive = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.isActive = !product.isActive;
    await product.save();

    await logAction(req, 'TOGGLE_PRODUCT_ACTIVE', 'Product', product._id, `${product.isActive ? 'Activated' : 'Deactivated'} product: ${product.name}`);

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload product images
 * @route   POST /api/admin/products/:id/images
 */
exports.uploadImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const uploadPromises = req.files.map((f) => uploadToCloudinary(f.buffer));
    const results = await Promise.all(uploadPromises);
    const uploaded = results.map((r) => ({
      url: r.url,
      public_id: r.public_id,
      alt: product.name,
    }));

    product.images.push(...uploaded);
    await product.save();

    res.status(200).json({ success: true, images: product.images });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a specific image from product
 * @route   DELETE /api/admin/products/:id/images/:imageId
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const img = product.images.id(req.params.imageId);
    if (!img) return res.status(404).json({ success: false, message: 'Image not found' });

    // Remove from Cloudinary
    if (img.public_id) {
      await deleteFromCloudinary(img.public_id);
    }

    product.images = product.images.filter((i) => i._id.toString() !== req.params.imageId);
    await product.save();

    res.status(200).json({ success: true, images: product.images });
  } catch (error) {
    next(error);
  }
};
