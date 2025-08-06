// validations/addressValidation.js
const Joi = require("joi");

const addressValidationSchema = Joi.object({
    customer: Joi.string().required().label("Customer ID"),
    label: Joi.string().valid("Home", "Office", "Other").default("work"),
    address: Joi.string().required().label("Address"),
    city: Joi.string().required().label("City"),
    state: Joi.string().required().label("State"),
    pinCode: Joi.string().allow("", null).optional().label("Pin Code"),
    country: Joi.string().default("India"),
    name: Joi.string().required().messages({
        'string.empty': 'Name is required for customer.',
    }),
    mobile: Joi.string().required().messages({
        'string.empty': 'Mobile is required for customer.',
    }),
    coordinates: Joi.array()
        .items(Joi.number())
        .length(2)
        .optional()
        .label("Coordinates"),
    type: Joi.string().valid("shipping", "billing", "both").default("shipping"),
    isDefault: Joi.boolean().default(false)
});

module.exports = {
    addressValidationSchema
};
