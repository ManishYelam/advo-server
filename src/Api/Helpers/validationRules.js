const Joi = require('joi');
const { SUPPORTED_LANGUAGES } = require('./constants');

module.exports = {
  userRegistrationSchema: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(3).required(),
    language: Joi.string()
      .valid(...SUPPORTED_LANGUAGES)
      .optional(),
  }),

  userLoginSchema: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  passwordResetSchema: Joi.object({
    email: Joi.string().email().required(),
    newPassword: Joi.string().min(8).required(),
  }),
};
