const Joi = require("joi");

const vehicleSegmentTypeSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    'string.empty': 'Name cannot be empty',
  }),
  status: Joi.boolean().default(true).messages({
    'boolean.base': `status must be a boolean`,
  }),
});

module.exports = { vehicleSegmentTypeSchema };
