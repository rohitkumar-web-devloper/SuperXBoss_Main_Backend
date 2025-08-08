const Joi = require("joi");

const createWalletSchema = Joi.object({
    amount: Joi.number().required(),
    offer_amount: Joi.number().required(),
    status: Joi.boolean().optional()
});

const updateWalletSchema = Joi.object({
    amount: Joi.number().required(),
    offer_amount: Joi.number().required(),
    status: Joi.boolean().optional()
});

module.exports = {
    createWalletSchema,
    updateWalletSchema
};
