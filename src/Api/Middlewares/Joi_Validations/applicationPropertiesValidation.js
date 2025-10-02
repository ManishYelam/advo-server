const Joi = require('joi');

const propertyValidationSchema = Joi.object({
  property_name: Joi.string().max(255).required(),
  property_value: Joi.string().max(255).required(),
  desc: Joi.string().max(500).optional(),
  metadata: Joi.object().optional(),
});

const propertyBulkValidationSchema = Joi.array().items(
  Joi.object({
    property_name: Joi.string().max(255).required(),
    property_value: Joi.string().max(255).required(),
    desc: Joi.string().max(500).optional(),
    metadata: Joi.object().optional(),
  })
);

module.exports = { propertyValidationSchema, propertyBulkValidationSchema };
