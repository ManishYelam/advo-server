const Joi = require('joi');

// Define a reusable password validation schema
const passwordValidation = Joi.string()
  .pattern(new RegExp(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/))
  .required()
  .messages({
    'string.pattern.base':
      'Password must be 8-16 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character.',
    'any.required': 'Password is required.',
  });

const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().min(8).max(255).required(),
});

const changePasswordSchema = Joi.object({
  old_password: Joi.string().min(8).max(255).required(),
  new_password: passwordValidation, // Reusing the password validation schema
});

const resetPasswordSchema = Joi.object({
  otp: Joi.string().required(),
  new_password: passwordValidation, // Reusing the password validation schema
});

module.exports = {
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
};
