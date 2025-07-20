const Joi = require('joi');

const bannerSchema = Joi.object({
    image: Joi.string()
        .required()
        .messages({
            'string.base': 'Image must be a string.',
            'any.required': 'Image is required.',
            'string.empty': 'Image cannot be empty.',
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
});

module.exports = { bannerSchema }