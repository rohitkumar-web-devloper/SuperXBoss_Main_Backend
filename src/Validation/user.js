const Joi = require('joi');

const userValidationSchema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Name is required',
        'any.required': 'Name is required',
    }),

    profile: Joi.string().allow('').optional(),

    parent: Joi.string().hex().length(24).allow(null).optional().messages({
        'string.hex': 'Parent ID must be a valid ObjectId',
        'string.length': 'Parent ID must be 24 characters',
    }),

    role: Joi.string().valid('admin', 'user', 'manager', 'vendor').default('admin').messages({
        'any.only': 'Role must be one of admin, user, manager, or vendor',
    }),

    address: Joi.string().allow(null, '').optional(),

    mobile: Joi.string().required().pattern(/^[0-9]{10,15}$/).messages({
        'string.pattern.base': 'Mobile must be a valid number (10-15 digits)',
        'string.empty': 'Mobile is required',
        'any.required': 'Mobile is required',
    }),

    whatsapp: Joi.string().required().pattern(/^[0-9]{10,15}$/).messages({
        'string.pattern.base': 'Whatsapp must be a valid number (10-15 digits)',
        'string.empty': 'Whatsapp is required',
        'any.required': 'Whatsapp is required',
    }),

    countryCode: Joi.string().optional().default('+91'),

    email: Joi.string().email().required().messages({
        'string.email': 'Email must be a valid email',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
    }),

    type: Joi.string().valid('vendor', 'customer', 'admin').default('admin').messages({
        'any.only': 'Type must be vendor, customer, or admin',
    }),

    access_token: Joi.string().optional().allow(''),

    status: Joi.boolean().default(true),

    password: Joi.when('type', {
        is: Joi.not('customer'),
        then: Joi.string().min(6).required().messages({
            'string.min': 'Password must be at least 6 characters',
            'any.required': 'Password is required for non-customer users',
        }),
        otherwise: Joi.string().optional().allow(''),
    })
});

const userLoginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Email must be a valid email',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
    }),
    password: Joi.when('type', {
        is: Joi.not('customer'),
        then: Joi.string().min(6).required().messages({
            'string.min': 'Password must be at least 6 characters',
            'any.required': 'Password is required for non-customer users',
        }),
        otherwise: Joi.string().optional().allow(''),
    })
});
module.exports = { userValidationSchema , userLoginSchema }