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
  console.log('📦 [CREATE PRODUCT] Request received');
  console.log('📦 [CREATE PRODUCT] Body keys:', Object.keys(req.body));
  console.log('📦 [CREATE PRODUCT] Files count:', req.files?.length || 0);

  try {
    const data = { ...req.body };

    // ─── VALIDATION: Required fields ───
    const validationErrors = [];

    if (!data.name || data.name.trim() === '') {
      validationErrors.push('Product name is required');
    }
    if (!data.price || isNaN(Number(data.price)) || Number(data.price) < 0) {
      validationErrors.push('Valid product price is required (must be a positive number)');
    }
    if (!data.category || data.category.trim() === '') {
      validationErrors.push('Product category is required');
    }
    if (!data.description || data.description.trim() === '') {
      validationErrors.push('Product description is required');
    }

    if (validationErrors.length > 0) {
      console.error('❌ [CREATE PRODUCT] Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: validationErrors.join('. '),
        errors: validationErrors,
      });
    }

    // ─── Parse JSON fields (multipart form sends as strings) ───
    const parseJSONField = (field, fieldName) => {
      if (typeof field === 'string' && field.trim()) {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.error(`⚠️ [CREATE PRODUCT] Failed to parse ${fieldName}:`, e.message);
          return field === '[]' || field === '' ? [] : field;
        }
      }
      return field;
    };

    data.sizes = parseJSONField(data.sizes, 'sizes') || [];
    data.colors = parseJSONField(data.colors, 'colors') || [];
    data.tags = parseJSONField(data.tags, 'tags') || [];
    data.images = parseJSONField(data.images, 'images') || [];
    data.sizeChart = parseJSONField(data.sizeChart, 'sizeChart') || [];
    data.fabricDetails = parseJSONField(data.fabricDetails, 'fabricDetails') || {};
    data.styleWith = parseJSONField(data.styleWith, 'styleWith') || [];
    data.modelInfo = parseJSONField(data.modelInfo, 'modelInfo') || {};

    // ─── Generate unique slug ───
    data.slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);

    console.log('📦 [CREATE PRODUCT] Generated slug:', data.slug);

    // ─── Handle image uploads to Cloudinary ───
    if (req.files && req.files.length > 0) {
      console.log(`📤 [CREATE PRODUCT] Uploading ${req.files.length} image(s) to Cloudinary...`);
      
      const uploadResults = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          console.log(`📤 [CREATE PRODUCT] Uploading file ${i + 1}/${req.files.length}: ${file.originalname} (${file.size} bytes)`);
          const result = await uploadToCloudinary(file.buffer);
          
          if (!result || !result.url) {
            throw new Error(`Cloudinary returned invalid response for file: ${file.originalname}`);
          }
          
          uploadResults.push({
            url: result.url,
            public_id: result.public_id,
            alt: data.name,
          });
          console.log(`✅ [CREATE PRODUCT] File ${i + 1} uploaded: ${result.url}`);
        } catch (uploadError) {
          console.error(`❌ [CREATE PRODUCT] Failed to upload ${file.originalname}:`, uploadError.message);
          return res.status(500).json({
            success: false,
            message: `Image upload failed for "${file.originalname}": ${uploadError.message}`,
            error: 'CLOUDINARY_UPLOAD_FAILED',
          });
        }
      }
      
      data.images = [...(data.images || []), ...uploadResults];
      console.log(`✅ [CREATE PRODUCT] All ${uploadResults.length} images uploaded successfully`);
    }

    // ─── Validate at least one image exists ───
    if (!data.images || data.images.length === 0) {
      console.error('❌ [CREATE PRODUCT] No images provided');
      return res.status(400).json({
        success: false,
        message: 'At least one product image is required',
        error: 'NO_IMAGES',
      });
    }

    // ─── Validate all images have valid URLs ───
    const invalidImages = data.images.filter(img => !img.url || !img.url.startsWith('http'));
    if (invalidImages.length > 0) {
      console.error('❌ [CREATE PRODUCT] Invalid image URLs found:', invalidImages);
      return res.status(400).json({
        success: false,
        message: 'One or more images have invalid URLs',
        error: 'INVALID_IMAGE_URLS',
      });
    }

    // ─── Calculate total stock from sizes ───
    if (data.sizes && Array.isArray(data.sizes)) {
      data.totalStock = data.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
    }

    // ─── Convert price to number ───
    data.price = Number(data.price);
    if (data.comparePrice) data.comparePrice = Number(data.comparePrice);

    console.log('📦 [CREATE PRODUCT] Saving to database...');
    console.log('📦 [CREATE PRODUCT] Data summary:', {
      name: data.name,
      price: data.price,
      category: data.category,
      imagesCount: data.images.length,
      sizesCount: data.sizes?.length || 0,
      totalStock: data.totalStock,
    });

    // ─── Create product in database ───
    const product = await Product.create(data);
    console.log(`✅ [CREATE PRODUCT] Product created with ID: ${product._id}`);

    // ─── Populate references for response ───
    const populated = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('styleWith', 'name slug images price comparePrice');

    // ─── Log action for audit trail ───
    await logAction(req, 'CREATE_PRODUCT', 'Product', product._id, `Created product: ${product.name}`);

    console.log(`✅ [CREATE PRODUCT] Success! Product "${product.name}" saved`);
    res.status(201).json({ success: true, product: populated });

  } catch (error) {
    console.error('❌ [CREATE PRODUCT] Error:', error.message);
    console.error('❌ [CREATE PRODUCT] Stack:', error.stack);

    // ─── Handle specific MongoDB errors ───
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
        errors: messages,
        error: 'VALIDATION_ERROR',
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `A product with this ${field} already exists`,
        error: 'DUPLICATE_KEY',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
        error: 'CAST_ERROR',
      });
    }

    // ─── Pass to global error handler ───
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/admin/products/:id
 */
exports.updateProduct = async (req, res, next) => {
  console.log(`📦 [UPDATE PRODUCT] Request for ID: ${req.params.id}`);
  console.log('📦 [UPDATE PRODUCT] Body keys:', Object.keys(req.body));
  console.log('📦 [UPDATE PRODUCT] Files count:', req.files?.length || 0);

  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      console.error(`❌ [UPDATE PRODUCT] Product not found: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const data = { ...req.body };

    // ─── Parse JSON fields (multipart form sends as strings) ───
    const parseJSONField = (field, fieldName) => {
      if (typeof field === 'string' && field.trim()) {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.error(`⚠️ [UPDATE PRODUCT] Failed to parse ${fieldName}:`, e.message);
          return field === '[]' || field === '' ? [] : field;
        }
      }
      return field;
    };

    data.sizes = parseJSONField(data.sizes, 'sizes');
    data.colors = parseJSONField(data.colors, 'colors');
    data.tags = parseJSONField(data.tags, 'tags');
    data.images = parseJSONField(data.images, 'images');
    data.sizeChart = parseJSONField(data.sizeChart, 'sizeChart');
    data.fabricDetails = parseJSONField(data.fabricDetails, 'fabricDetails');
    data.styleWith = parseJSONField(data.styleWith, 'styleWith');
    data.modelInfo = parseJSONField(data.modelInfo, 'modelInfo');

    // ─── Handle image uploads to Cloudinary ───
    if (req.files && req.files.length > 0) {
      console.log(`📤 [UPDATE PRODUCT] Uploading ${req.files.length} image(s) to Cloudinary...`);
      
      const uploadResults = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          console.log(`📤 [UPDATE PRODUCT] Uploading file ${i + 1}/${req.files.length}: ${file.originalname} (${file.size} bytes)`);
          const result = await uploadToCloudinary(file.buffer);
          
          if (!result || !result.url) {
            throw new Error(`Cloudinary returned invalid response for file: ${file.originalname}`);
          }
          
          uploadResults.push({
            url: result.url,
            public_id: result.public_id,
            alt: data.name || product.name,
          });
          console.log(`✅ [UPDATE PRODUCT] File ${i + 1} uploaded: ${result.url}`);
        } catch (uploadError) {
          console.error(`❌ [UPDATE PRODUCT] Failed to upload ${file.originalname}:`, uploadError.message);
          return res.status(500).json({
            success: false,
            message: `Image upload failed for "${file.originalname}": ${uploadError.message}`,
            error: 'CLOUDINARY_UPLOAD_FAILED',
          });
        }
      }
      
      data.images = [...(data.images || product.images || []), ...uploadResults];
      console.log(`✅ [UPDATE PRODUCT] All ${uploadResults.length} new images uploaded`);
    }

    // ─── Recalc total stock ───
    if (data.sizes && Array.isArray(data.sizes)) {
      data.totalStock = data.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
    }

    // ─── Convert price to number if provided ───
    if (data.price) data.price = Number(data.price);
    if (data.comparePrice) data.comparePrice = Number(data.comparePrice);

    console.log('📦 [UPDATE PRODUCT] Updating in database...');

    product = await Product.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug').populate('styleWith', 'name slug images price comparePrice');

    await logAction(req, 'UPDATE_PRODUCT', 'Product', req.params.id, `Updated product: ${product.name}`);

    console.log(`✅ [UPDATE PRODUCT] Success! Product "${product.name}" updated`);
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('❌ [UPDATE PRODUCT] Error:', error.message);
    console.error('❌ [UPDATE PRODUCT] Stack:', error.stack);

    // ─── Handle specific MongoDB errors ───
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
        errors: messages,
        error: 'VALIDATION_ERROR',
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `A product with this ${field} already exists`,
        error: 'DUPLICATE_KEY',
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
        error: 'CAST_ERROR',
      });
    }

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
