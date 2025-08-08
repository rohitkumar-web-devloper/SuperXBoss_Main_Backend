const Joi = require('joi');
const mongoose = require('mongoose');

// Define Joi schema
const vehicleValidationSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'string.empty': 'Name is required',
    }),
    description: Joi.string().allow(null, '').optional(),
    picture: Joi.string().uri().allow(null, '').optional(),
    status: Joi.boolean().optional(),
    start_year: Joi.number().required(),
    end_year: Joi.number().required(),
    createdBy: Joi.string()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .optional()
        .messages({
            'any.invalid': 'Invalid createdBy ID',
        }),
    updatedBy: Joi.string()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .optional()
        .messages({
            'any.invalid': 'Invalid updatedBy ID',
        }),
});
const vehicleValidationUpdateSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'string.empty': 'Name is required',
    }),
    description: Joi.string().allow(null, '').optional(),
    start_year: Joi.number().required(),
    end_year: Joi.number().required(),
    picture: Joi.string().uri().allow(null, '').optional(),
    status: Joi.boolean().optional(),
    createdBy: Joi.string()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .optional()
        .messages({
            'any.invalid': 'Invalid createdBy ID',
        }),
    updatedBy: Joi.string()
        .custom((value, helpers) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
            }
            return value;
        })
        .optional()
        .messages({
            'any.invalid': 'Invalid updatedBy ID',
        }),
});

module.exports = { vehicleValidationSchema, vehicleValidationUpdateSchema };
