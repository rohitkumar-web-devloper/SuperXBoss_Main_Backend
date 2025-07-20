// validation/category.validation.js
const Joi = require('joi');
const mongoose = require('mongoose');

// Reusable ObjectId validator
const objectId = (value, helpers) => {
    if (!value) return value;          // allow null / undefined separately in rules
    if (mongoose.Types.ObjectId.isValid(value)) return value;
    return helpers.error('any.invalid');
};

// Common constraints (adjust lengths as needed)
const nameMax = 80;
const descMax = 500;

const createCategorySchema = Joi.object({
    name: Joi.string().trim().min(1).max(120).required()
        .label('Name')
        .messages({
            'any.required': '{#label} is required',
            'string.empty': '{#label} is required'
        }),
    picture: Joi.string().uri({ allowRelative: true }).allow('', null)
        .label('Picture')
        .messages({
            'string.uri': '{#label} must be a valid URL'
        }),
    parent: Joi.alternatives().try(Joi.string().custom(objectId), Joi.valid(null))
        .label('Parent'),
    description: Joi.string().trim().max(500)
        .label('Description'),
    featured: Joi.boolean().label('Featured'),
    trending: Joi.string().trim().allow('').max(60).label('Trending'),
    sorting: Joi.string().trim().allow('').max(60).label('Sorting'),
    status: Joi.boolean().label('Status'),
    user: Joi.alternatives().try(Joi.string().custom(objectId), Joi.valid(null)).label('User'),
    createdBy: Joi.alternatives().try(Joi.string().custom(objectId), Joi.valid(null)).label('Created By'),
}).unknown(false);

const updateCategorySchema = Joi.object({
    _id: Joi.string().custom(objectId), // Optional _id field
    name: Joi.string().trim().min(1).max(nameMax),
    picture: Joi.string().uri({ allowRelative: true }).allow('', null),
    parent: Joi.alternatives().try(Joi.string().custom(objectId), Joi.valid(null)),
    description: Joi.string().trim().max(descMax),
    featured: Joi.boolean(),
    trending: Joi.string().trim().allow('').max(60),
    sorting: Joi.string().trim().allow('').max(60),
    status: Joi.boolean(),
    user: Joi.string().custom(objectId),
    createdBy: Joi.string().custom(objectId)
})
    .min(1)           // require at least one field on update
    .unknown(false);

module.exports = {
    createCategorySchema,
    updateCategorySchema
};
