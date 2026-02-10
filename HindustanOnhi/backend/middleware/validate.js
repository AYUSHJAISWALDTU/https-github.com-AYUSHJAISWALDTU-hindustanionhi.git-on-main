const Joi = require('joi');

/**
 * Joi validation middleware factory
 * Usage: router.post('/login', validate(loginSchema), controller)
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: false,
      allowUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${message}`,
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    // Merge validated values back
    if (source === 'body') req.body = { ...req.body, ...value };
    next();
  };
};

/* ═══════════════════════════════════════
   Validation Schemas
   ═══════════════════════════════════════ */

// Auth
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow('')
    .messages({ 'string.pattern.base': 'Phone must be a valid 10-digit Indian number' }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const googleLoginSchema = Joi.object({
  credential: Joi.string().required(),
});

// Profile
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .allow('')
    .messages({ 'string.pattern.base': 'Phone must be a valid 10-digit Indian number' }),
});

const addressSchema = Joi.object({
  fullName: Joi.string().min(2).max(80).required(),
  phone: Joi.string().length(10).pattern(/^\d+$/).required().messages({
    'string.length': 'Phone must be 10 digits',
  }),
  addressLine1: Joi.string().min(5).max(200).required(),
  addressLine2: Joi.string().max(200).optional().allow(''),
  city: Joi.string().min(2).max(80).required(),
  state: Joi.string().min(2).max(80).required(),
  pincode: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'Pincode must be 6 digits',
  }),
  isDefault: Joi.boolean().optional(),
});

// Review
const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().max(100).optional().allow(''),
  comment: Joi.string().max(2000).optional().allow(''),
});

// Order
const placeOrderSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    phone: Joi.string().required(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
  }).required(),
  paymentMethod: Joi.string().valid('razorpay', 'cod').required(),
});

// Cart
const addToCartSchema = Joi.object({
  productId: Joi.string().required(),
  size: Joi.string().required(),
  color: Joi.string().optional().allow(''),
  quantity: Joi.number().integer().min(1).max(10).optional().default(1),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(10).required(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  googleLoginSchema,
  updateProfileSchema,
  addressSchema,
  reviewSchema,
  placeOrderSchema,
  addToCartSchema,
  updateCartItemSchema,
};
