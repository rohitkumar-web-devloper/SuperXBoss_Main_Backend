const Joi = require('joi');
const mongoose = require('mongoose');

// Custom ObjectId validator for MongoDB IDs
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message(`"${helpers.state.path.join('.')}" must be a valid ObjectId`);
  }
  return value;
};


const brandSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.base': `name must be a string`,
    'any.required': `name is required`,
  }),
  logo: Joi.object().min(1).required().messages({
    'object.base': 'logo must be an object',
    'object.min': 'logo must contain at least one key',
    'any.required': 'logo is required',
  }),
  description: Joi.string().allow(null, '').messages({
    'string.base': `description must be a string`,
  }),
  type: Joi.string().allow(null, '').required().messages({
    'string.base': `type must be a string`,
    'any.required': `type is required`,
  }),
  brand_day: Joi.boolean().default(false).messages({
    'boolean.base': `brand_day must be a boolean`,
  }),
  brand_day_offer: Joi.number().optional().default(0).messages({
    'number.base': `brand_day_offer must be a number`,
  }),
  brand_segment: Joi.array()
    .items(Joi.string().custom(objectId).messages({
      'string.base': `"brand_segment" must contain string ObjectIds`,
      'any.invalid': `"brand_segment" must contain valid ObjectIds`,
    }))
    .required()
    .messages({
      'array.base': `"brand_segment" must be an array`,
      'any.required': `"brand_segment" is required`,
    }),
  sorting: Joi.number().default(0).messages({
    'number.base': `sorting must be a number`,
  }),
  status: Joi.boolean().default(true).messages({
    'boolean.base': `status must be a boolean`,
  }),
});



const updateBrandSchema = Joi.object({
  brandId: Joi.string().optional(),
  name: Joi.string().messages({
    'string.base': `name must be a string`,
  }),
  logo: Joi.object().messages({
    'object.base': 'logo must be an object',
    'object.min': 'logo must contain at least one key',
  }),
  description: Joi.string().allow(null, '').messages({
    'string.base': `description must be a string`,
  }),
  type: Joi.string().allow(null, '').messages({
    'string.base': `type must be a string`,
  }),
  brand_day: Joi.boolean().default(false).messages({
    'boolean.base': `brand_day must be a boolean`,
  }),
  brand_day_offer: Joi.number().default(0).messages({
    'number.base': `brand_day_offer must be a number`,
  }),
  brand_segment: Joi.array()
    .items(Joi.string().custom(objectId).messages({
      'string.base': `"brand_segment" must contain string ObjectIds`,
      'any.invalid': `"brand_segment" must contain valid ObjectIds`,
    }))
    .required()
    .messages({
      'array.base': `"brand_segment" must be an array`,
      'any.required': `"brand_segment" is required`,
    }),
  sorting: Joi.number().default(0).messages({
    'number.base': `sorting must be a number`,
  }),
  status: Joi.boolean().default(true).messages({
    'boolean.base': `status must be a boolean`,
  }),
});
module.exports = { brandSchema, updateBrandSchema };
