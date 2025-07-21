const Joi = require('joi');

const customerLoginSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.base': 'Mobile number must be a string.',
      'string.empty': 'Mobile number is required.',
      'string.pattern.base': 'Mobile number must be exactly 10 digits.',
      'any.required': 'Mobile number is required.',
    }),
});


const customerVerifyOtpSchema = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.base': 'Mobile number must be a string.',
      'string.empty': 'Mobile number is required.',
      'string.pattern.base': 'Mobile number must be exactly 10 digits.',
      'any.required': 'Mobile number is required.',
    }),

  otp: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .required()
    .messages({
      'string.base': 'OTP must be a string.',
      'string.empty': 'OTP is required.',
      'string.pattern.base': 'OTP must be exactly 4 digits.',
      'any.required': 'OTP is required.',
    }),
});



const customerUpdateSchema = Joi.object({
  customerId: Joi.string()
    .required()
    .messages({
      'string.base': 'Customer ID must be a string.',
      'string.empty': 'Customer ID cannot be empty.',
      'any.required': 'Customer ID is required.',
    }),

  type: Joi.string().valid('customer', 'b2b').required().messages({
    'any.only': 'Type must be either "customer" or "b2b".',
    'any.required': 'Type is required.',
  }),

  first_name: Joi.string().when('type', {
    is: 'customer',
    then: Joi.string().required().messages({
      'string.empty': 'First name is required for customer.',
    }),
    otherwise: Joi.string().optional(),
  }),

  last_name: Joi.string().when('type', {
    is: 'customer',
    then: Joi.string().required().messages({
      'string.empty': 'Last name is required for customer.',
    }),
    otherwise: Joi.string().optional(),
  }),

  refer_code: Joi.string().optional(),

  refrence_code: Joi.string().when('type', {
    is: 'customer',
    then: Joi.string().required().messages({
      'string.empty': 'Reference code is required for customer.',
    }),
    otherwise: Joi.string().optional(),
  }),

  business_type: Joi.string().when('type', {
    is: 'b2b',
    then: Joi.string().required().messages({
      'string.empty': 'Business type is required for b2b.',
    }),
    otherwise: Joi.string().optional(),
  }),

  business_name: Joi.string().when('type', {
    is: 'b2b',
    then: Joi.string().required().messages({
      'string.empty': 'Business name is required for b2b.',
    }),
    otherwise: Joi.string().optional(),
  }),

  gst_number: Joi.when('type', {
  is: 'b2b',
  then: Joi.string()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .required()
    .messages({
      'string.pattern.base': 'GST number must be a valid 15-character GSTIN.',
      'string.empty': 'GST number is required for b2b.',
    }),
  otherwise: Joi.string().optional(),
}),

  business_contact_no: Joi.string().when('type', {
    is: 'b2b',
    then: Joi.string().required().messages({
      'string.empty': 'Business contact number is required for b2b.',
    }),
    otherwise: Joi.string().optional(),
  }),

  state: Joi.string().required().messages({
    'string.empty': 'State is required.',
    'any.required': 'State is required.',
  }),

  language: Joi.string().required().messages({
    'string.empty': 'Language is required.',
    'any.required': 'Language is required.',
  }),

  email: Joi.string().email().optional().messages({
    'string.email': 'Email must be a valid email address.',
  }),

  profile: Joi.object().optional().messages({
    'object.base': 'Profile must be an object.',
  }),
});


module.exports = { customerLoginSchema, customerVerifyOtpSchema, customerUpdateSchema };
