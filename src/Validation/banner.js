const Joi = require('joi');

const bannerSchema = Joi.object({
  image: Joi.object().min(1).required().messages({
    'object.base': 'logo must be an object',
    'object.min': 'logo must contain at least one key',
    'any.required': 'logo is required',
  }),

  product_id: Joi.string()
    .required()
    .messages({
      'string.base': 'Product ID must be a string.',
      'any.required': 'Product ID is required.',
      'string.empty': 'Product ID cannot be empty.',
    }),

  status: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Status must be a boolean.',
    }),
  position: Joi.string()
    .optional()
    .messages({
      'boolean.base': 'Position must be a boolean.',
    }),
});


const updateBannerSchema = Joi.object({
  image: Joi.object().min(1).optional().messages({
    'object.base': 'Logo must be an object.',
    'object.min': 'Logo must contain at least one key.',
  }),
  product_id: Joi.string().optional().messages({
    'string.base': 'Product ID must be a string.',
    'string.empty': 'Product ID cannot be empty.',
  }),
  status: Joi.boolean().optional().messages({
    'boolean.base': 'Status must be a boolean.',
  }),
  position: Joi.string()
    .optional()
    .messages({
      'boolean.base': 'Position must be a boolean.',
    }),
});

module.exports = { bannerSchema, updateBannerSchema }