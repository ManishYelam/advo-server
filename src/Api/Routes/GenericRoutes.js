const express = require('express');
const listOfValuesController = require('../Controllers/GenericController');
const genericRouter = express.Router();

genericRouter
  .post('/lov', listOfValuesController.createOrUpdateLOV) // Upsert LOV
  .get('/lov', listOfValuesController.getAllLOVs) // Get all LOVs (Filter by category)
  .get('/lov/:id', listOfValuesController.getLOVById) // Get LOV by ID
  .delete('/lov/:id', listOfValuesController.deleteLOV); // Soft delete LOV

module.exports = genericRouter;
