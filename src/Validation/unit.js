const Joi = require("joi");

const createUnitSchema = Joi.object({
    name: Joi.string().required(),
    set: Joi.number().required(),
    pc: Joi.number().optional(),
    status: Joi.boolean().optional()
});

const updateUnitSchema = Joi.object({
    name: Joi.string().optional(),
    set: Joi.number().optional(),
    pc: Joi.number().optional(),
    status: Joi.boolean().optional()
});

module.exports = {
    createUnitSchema,
    updateUnitSchema
};
