const express = require('express');
const authMiddleware = require('../Middlewares/authorizationMiddleware');
const roleAuth = require('../Middlewares/roleAuth');
const validate = require('../Middlewares/validateMiddleware');
const { submitFeedback, getUserFeedback, getAllFeedback, updateStatus } = require('../Middlewares/Joi_Validations/feedbackValidation');
const feedbackController = require('../Controllers/feedbackController');
const feedbackRouter = express.Router();

// Routes
feedbackRouter
  .post('/submit', authMiddleware, validate(submitFeedback), feedbackController.submitFeedback)
  .get('/my-feedback', authMiddleware, validate(getUserFeedback), feedbackController.getUserFeedback)

  // Admin only routes
  .get('/', authMiddleware, roleAuth(['admin']), validate(getAllFeedback), feedbackController.getAllFeedback)
  .get('/stats', authMiddleware, roleAuth(['admin']), feedbackController.getFeedbackStats)
  .get('/:id', authMiddleware, feedbackController.getFeedbackById)
  .patch('/:id/status', authMiddleware, roleAuth(['admin']), validate(updateStatus), feedbackController.updateFeedbackStatus)
  .delete('/:id', authMiddleware, roleAuth(['admin']), feedbackController.deleteFeedback);

module.exports = feedbackRouter;
