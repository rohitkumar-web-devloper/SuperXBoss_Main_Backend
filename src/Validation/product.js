
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
    segment_type: Joi.array()
        .items(Joi.string().custom(objectId).messages({
            'string.base': `"brand_segment" must contain string ObjectIds`,
            'any.invalid': `"brand_segment" must contain valid ObjectIds`,
        }))
        .required()
        .messages({
            'array.base': `"brand_segment" must be an array`,
            'any.required': `"brand_segment" is required`,
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
    bulk_discount: Joi.array()
        .items(
            Joi.object({
                count: Joi.number().min(1).required(),
                discount: Joi.number().min(0).max(100).required(),
            })
        )
        .optional(),
});

module.exports = { productJoiSchema }