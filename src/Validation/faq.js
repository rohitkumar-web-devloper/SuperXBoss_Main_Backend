const Joi = require('joi');

const customMessages = {
    'string.base': '{#label} should be a type of text',
    'string.empty': '{#label} cannot be empty',
    'string.max': '{#label} should not exceed {#limit} characters',
    'number.base': '{#label} should be a type of number',
    'boolean.base': '{#label} should be a type of boolean',
    'any.required': '{#label} is a required field',
    'any.only': '{#label} must be one of {#valids}'
};

const createFaqSchema = Joi.object({
    question: Joi.string()
        .max(200)
        .required()
        .messages({
            ...customMessages,
            'string.max': 'Question cannot exceed 200 characters',
            'any.required': 'Question is required'
        }),
    answer: Joi.string()
        .max(5000)
        .optional()
        .messages({
            ...customMessages,
            'string.max': 'Answer cannot exceed 5000 characters',
        }),
    sorting: Joi.number()
        .default(0)
        .messages({
            ...customMessages,
            'number.base': 'Sorting must be a number'
        }),
    status: Joi.boolean()
        .default(true)
        .messages({
            ...customMessages,
            'boolean.base': 'Status must be true or false'
        }),
    type: Joi.string()
        .valid('general', 'technical', 'account')
        .default('general')
        .messages({
            ...customMessages,
            'any.only': 'Type must be either general, technical, or account'
        }),
    createdBy: Joi.string()
        .optional()
        .messages({
            ...customMessages,
            'any.required': 'User reference is required'
        })
}).options({ abortEarly: false });

const updateFaqSchema = Joi.object({
    question: Joi.string()
        .max(200)
        .messages({
            ...customMessages,
            'string.max': 'Question cannot exceed 200 characters'
        }),
    answer: Joi.string()
        .max(5000)
        .messages({
            ...customMessages,
            'string.max': 'Answer cannot exceed 5000 characters'
        }),
    sorting: Joi.number()
        .messages({
            ...customMessages,
            'number.base': 'Sorting must be a number'
        }),
    status: Joi.boolean()
        .messages({
            ...customMessages,
            'boolean.base': 'Status must be true or false'
        }),
    type: Joi.string()
        .valid('general', 'technical', 'account')
        .messages({
            ...customMessages,
            'any.only': 'Type must be either general, technical, or account'
        })
}).options({ abortEarly: false });

module.exports = { createFaqSchema, updateFaqSchema };