const express = require('express');
const authMiddleware = require('../Middlewares/authorizationMiddleware');
const CaseController = require('../Controllers/CaseController');
const validateAsync = require('../Middlewares/validateAsyncMiddleware');
const validate = require('../Middlewares/validateMiddleware');
const { create_client_case_schema, create_admin_case_schema } = require('../Middlewares/Joi_Validations/caseSchma');

const caseRouter = express.Router();

// Case routes
caseRouter
  // Create a new case
  .post('/client', authMiddleware, validate(create_client_case_schema),CaseController.createCase)
  .post('/admin', authMiddleware, validate(create_admin_case_schema),CaseController.createCase)

  // Get all cases (with pagination, search, and filters)
  .post('/', authMiddleware, CaseController.getAllCases)

  // Get a single case by ID
  .get('/:id', authMiddleware, CaseController.getCaseById)

  // Update a case by ID
  .put('/:id/client', authMiddleware , CaseController.updateCase)
  .put('/:id/admin', authMiddleware , CaseController.updateCase)

  // Delete a case by ID
  .delete('/:id', authMiddleware, CaseController.deleteCase);

// Export router
module.exports = {
  caseRouter,
};
