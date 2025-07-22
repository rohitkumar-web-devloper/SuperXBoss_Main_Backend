
// — 1. Define Joi schema for all non‐file fields — 
const Joi = require('joi');
const mongoose = require('mongoose');

// Custom ObjectId validator for MongoDB IDs
const objectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message(`"${helpers.state.path.join('.')}" must be a valid ObjectId`);
    }
    return value;
};
const productJoiSchema = Joi.object({
    name: Joi.string().max(255).required(),
    customer_price: Joi.number().min(0).required(),
    b2b_price: Joi.number().min(0).required(),
    point: Joi.number().min(0).optional(),
    new_arrival: Joi.boolean().optional(),
    pop_item: Joi.boolean().optional(),
    part_no: Joi.string().trim().required(),
    videoRemove: Joi.string().optional(),
    segment_type: Joi.array()
        .items(Joi.string().custom(objectId).messages({
            'string.base': `"segment_type" must contain string ObjectIds`,
            'any.invalid': `"segment_type" must contain valid ObjectIds`,
        }))
        .required()
        .messages({
            'array.base': `"segment_type" must be an array`,
            'any.required': `"segment_type" is required`,
        }),
    removed_images: Joi.array().items(Joi.string()).optional(),
    min_qty: Joi.number().min(1).optional(),
    wish_product: Joi.boolean().optional(),
    any_discount: Joi.number().min(0).max(100).optional(),
    brand_id: Joi.string().hex().length(24).required(),
    item_stock: Joi.number().min(0).optional(),
    sku_id: Joi.string().optional(),
    tax: Joi.number().min(0).max(100).optional(),
    hsn_code: Joi.string().optional(),
    ship_days: Joi.number().min(0).optional(),
    return_days: Joi.number().min(0).optional(),
    return_policy: Joi.string().optional(),
    weight: Joi.string().optional(),
    unit: Joi.string().optional(),
    status: Joi.boolean().optional(),
    trend_part: Joi.boolean().optional(),
    bulk_discount: Joi
        .string()
        .optional(),
});

module.exports = { productJoiSchema }