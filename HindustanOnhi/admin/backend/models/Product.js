const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    comparePrice: { type: Number, default: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, default: '' },
        alt: { type: String, default: '' },
      },
    ],
    sizes: [
      {
        size: { type: String, required: true },
        stock: { type: Number, default: 0, min: 0 },
      },
    ],
    colors: [
      {
        name: { type: String, required: true },
        hex: { type: String, default: '#000000' },
      },
    ],
    fabric: { type: String, default: '' },
    occasion: {
      type: String,
      enum: ['casual', 'festive', 'wedding', 'party', 'office', 'daily', ''],
      default: '',
    },
    tags: [String],

    /* ─── Size Chart ─── */
    sizeChart: [
      {
        size: String,
        bust: String,
        waist: String,
        hip: String,
        length: String,
      },
    ],

    /* ─── Fabric & Care Details ─── */
    fabricDetails: {
      fabric: { type: String, default: '' },
      lining: { type: String, default: '' },
      transparency: { type: String, default: '' },
      washCare: [String],
    },

    /* ─── Style With (related product refs) ─── */
    styleWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],

    /* ─── Model / Fit Info ─── */
    modelInfo: {
      height: { type: String, default: '' },
      wearingSize: { type: String, default: '' },
    },

    totalStock: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0 },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    productCollection: {
      type: String,
      enum: ['festive', 'wedding', 'daily-wear', ''],
      default: '',
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('discountPercent').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

productSchema.pre('save', function (next) {
  if (this.sizes && this.sizes.length > 0) {
    this.totalStock = this.sizes.reduce((sum, s) => sum + s.stock, 0);
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1, createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);
