const express = require('express');
const applicationRouter = express.Router();
const validate = require('../Middlewares/validateMiddleware');
const {
  propertyValidationSchema,
  propertyBulkValidationSchema,
} = require('../Middlewares/Joi_Validations/applicationPropertiesValidation');
const applicationPropertiesController = require('../Controllers/applicationPropertiesController');

applicationRouter
  .post('/property', validate(propertyValidationSchema), applicationPropertiesController.createOrUpdateProperty)
  .post('/properties/bulk', validate(propertyBulkValidationSchema), applicationPropertiesController.createOrUpdateBulkProperties)
  .get('/properties', applicationPropertiesController.getAllProperties)
  .get('/property/:id', applicationPropertiesController.getPropertyById)
  .delete('/property/:id', applicationPropertiesController.deleteProperty);

module.exports = applicationRouter;
