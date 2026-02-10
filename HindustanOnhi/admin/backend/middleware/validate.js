const Joi = require('joi');

/**
 * Joi validation middleware factory
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

    if (source === 'body') req.body = { ...req.body, ...value };
    next();
  };
};

/* ═══════════════════════════════════════
   Admin Validation Schemas
   ═══════════════════════════════════════ */

const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const productSchema = Joi.object({
  name: Joi.string().min(3).max(200).required().messages({
    'string.min': 'Product name must be at least 3 characters',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().min(10).required().messages({
    'string.min': 'Description must be at least 10 characters',
    'any.required': 'Description is required',
  }),
  price: Joi.number().positive().required().messages({
    'number.positive': 'Price must be a positive number',
    'any.required': 'Price is required',
  }),
  comparePrice: Joi.number().min(0).optional().allow('', 0),
  category: Joi.string().required().messages({
    'any.required': 'Category is required',
  }),
  fabric: Joi.string().max(100).optional().allow(''),
  occasion: Joi.string()
    .valid('casual', 'festive', 'wedding', 'party', 'office', 'daily', '')
    .optional(),
  productCollection: Joi.string()
    .valid('festive', 'wedding', 'daily-wear', '')
    .optional(),
  isFeatured: Joi.boolean().optional(),
  isNewArrival: Joi.boolean().optional(),
  isTrending: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
});

const categorySchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  description: Joi.string().max(500).optional().allow(''),
  image: Joi.string().uri().optional().allow(''),
});

const orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')
    .required(),
});

module.exports = {
  validate,
  adminLoginSchema,
  productSchema,
  categorySchema,
  orderStatusSchema,
};
