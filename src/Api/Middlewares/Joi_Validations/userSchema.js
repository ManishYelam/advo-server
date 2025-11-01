const Joi = require('joi');
const { checkExistsEmail } = require('../../Services/UserService');
const { prefixes } = require('../../../Config/Database/Data');
const { getAllLOVs } = require('../../Services/GenericServices');

const checkEmailDuplicate = async (value, helpers) => {
  const user = await checkExistsEmail(value);
  if (user) {
    return helpers.message(`Duplicate email found. Please provide a unique email address. Email - ${value}`);
  }
  return value;
};

const userSchema = Joi.object({
  email: Joi.string().email().max(100).required().external(checkEmailDuplicate),
  full_name: Joi.string().max(50).required(),
  date_of_birth: Joi.date().iso().optional(),
  phone_number: Joi.string().max(15).optional(),
  address: Joi.string().max(500).optional(),
  role: Joi.string().required().valid(),
  user_metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

const userUpdateSchema = Joi.object({
  email: Joi.string().email().max(100).optional(),
  full_name: Joi.string().max(50).optional(),
  date_of_birth: Joi.date().iso().optional(),
  phone_number: Joi.string().max(15).optional(),
  address: Joi.string().max(500).optional(),
  role_id: Joi.number().integer().optional(),
  user_metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
});

const roleSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500).optional(),
  created_by: Joi.string().required(),
  updated_by: Joi.string().required(),
});

module.exports = {
  userSchema,
  userUpdateSchema,
};

const generateUserSchema = async (isUpdate = false) => {
  return Joi.object({
    ...(isUpdate
      ? {
          status: Joi.string().valid('active', 'inactive').optional(),
        }
      : {
          email: Joi.string().max(100).required().external(checkEmailDuplicate),
        }),
    full_name: isUpdate ? Joi.string().max(50).optional() : Joi.string().max(50).required(),
    password: Joi.string().max(50).required(),
    date_of_birth: Joi.date().less('now').iso().optional(),
    phone_number: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be between 10-15 digits and numbers only',
      }),
    address: Joi.string().max(500).optional(),
    occupation: Joi.string().max(500).optional(),
    role: isUpdate
      ? Joi.string().valid('client', 'admin', 'advocate').optional()
      : Joi.string().valid('client', 'admin', 'advocate').required(),
    reg_link_status: Joi.string().valid('active', 'expired', 'pending').optional().messages({
      'any.only': 'reg_link_status must be one of active, expired, or pending',
    }),
    reg_type: Joi.string().valid('reg_link', 'manual').optional(),
    user_metadata: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
  });
};

const createUserSchema = () => generateUserSchema(false);
const updateUserSchema = () => generateUserSchema(true);

module.exports = { createUserSchema, updateUserSchema };
