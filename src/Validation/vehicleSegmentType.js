const Joi = require("joi");

const vehicleSegmentTypeSchema = Joi.object({
  segmentId: Joi.string().required().messages({
    'string.base': 'Segment ID must be a string.',
    'string.empty': 'Segment ID cannot be empty.',
    'any.required': 'Segment ID is required.',
  }),
  name: Joi.string().trim().optional().messages({
    'string.empty': 'Name cannot be empty',
  }),
  icon: Joi.object().optional().messages({
    'object.base': 'Icon must be an object.',
  }),
});

module.exports = { vehicleSegmentTypeSchema };
