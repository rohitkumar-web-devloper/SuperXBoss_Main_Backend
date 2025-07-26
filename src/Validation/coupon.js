const Joi = require('joi');

const createCouponSchema = Joi.object({
    code: Joi.string().allow("", null)
        .optional()
        .uppercase()
        .pattern(/^[A-Z0-9]+$/)
        .messages({
            'string.empty': 'Coupon code cannot be empty',
            'any.required': 'Coupon code is required',
            'string.pattern.base': 'Coupon code must contain only letters and numbers'
        }),

    amount: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
            'number.base': 'Discount amount must be a number',
            'number.integer': 'Discount amount must be a whole number',
            'number.min': 'Discount amount must be at least 1',
            'any.required': 'Discount amount is required'
        }),

    min_cart_amt: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
            'number.base': 'Minimum cart amount must be a number',
            'number.integer': 'Minimum cart amount must be a whole number',
            'number.min': 'Minimum cart amount cannot be negative',
            'any.required': 'Minimum cart amount is required'
        }),

    description: Joi.string().allow("", null)
        .max(500)
        .optional({
            'string.max': 'Description cannot exceed 500 characters'
        }),

    start_date: Joi.date()
        .required()
        .messages({
            'date.base': 'Start date must be a valid date',
            'any.required': 'Start date is required'
        }),

    end_date: Joi.date()
        .greater(Joi.ref('start_date'))
        .required()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.greater': 'End date must be after start date',
            'any.required': 'End date is required'
        }),

    status: Joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'Status must be true or false'
        })
}).options({ abortEarly: false });


const updateCouponSchema = Joi.object({
    code: Joi.string().required()
        .uppercase()
        .pattern(/^[A-Z0-9]+$/)
        .messages({
            'string.empty': 'Coupon code cannot be empty',
            'string.pattern.base': 'Coupon code must contain only letters and numbers'
        }),
    amount: Joi.number()
        .integer()
        .min(1),
    min_cart_amt: Joi.number()
        .integer()
        .min(0),
    status: Joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'Status must be true or false'
        }),
    start_date: Joi.date()
        .optional()
        .messages({
            'date.base': 'Start date must be a valid date',
        }),

    end_date: Joi.date()
        .greater(Joi.ref('start_date'))
        .optional()
        .messages({
            'date.base': 'End date must be a valid date',
            'date.greater': 'End date must be after start date',
        }),
}).options({ abortEarly: false });

module.exports = { createCouponSchema, updateCouponSchema };