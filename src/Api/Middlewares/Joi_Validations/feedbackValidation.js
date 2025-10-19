const Joi = require('joi');

const feedbackValidation = {
  // Submit feedback validation
  submitFeedback: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required().messages({
      'number.base': 'Rating must be a number',
      'number.integer': 'Rating must be an integer',
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
      'any.required': 'Rating is required',
    }),

    category: Joi.string().valid('general', 'bug', 'feature', 'ui', 'performance').required().messages({
      'string.base': 'Category must be a string',
      'any.only': 'Invalid category. Must be one of: general, bug, feature, ui, performance',
      'any.required': 'Category is required',
    }),

    message: Joi.string().min(10).max(2000).trim().required().messages({
      'string.base': 'Message must be a string',
      'string.min': 'Message must be at least 10 characters long',
      'string.max': 'Message must be less than 2000 characters',
      'string.empty': 'Message cannot be empty',
      'any.required': 'Message is required',
    }),
  }),

  // Update feedback status validation
  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'resolved', 'closed').required().messages({
      'string.base': 'Status must be a string',
      'any.only': 'Invalid status. Must be one of: pending, reviewed, resolved, closed',
      'any.required': 'Status is required',
    }),

    adminNotes: Joi.string().max(1000).trim().allow('', null).optional().messages({
      'string.base': 'Admin notes must be a string',
      'string.max': 'Admin notes must be less than 1000 characters',
    }),
  }),

  // Query parameters validation for getAllFeedback
  getAllFeedback: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),

    category: Joi.string().valid('general', 'bug', 'feature', 'ui', 'performance').optional().messages({
      'string.base': 'Category must be a string',
      'any.only': 'Invalid category',
    }),

    status: Joi.string().valid('pending', 'reviewed', 'resolved', 'closed').optional().messages({
      'string.base': 'Status must be a string',
      'any.only': 'Invalid status',
    }),

    userId: Joi.number().integer().min(1).optional().messages({
      'number.base': 'User ID must be a number',
      'number.integer': 'User ID must be an integer',
      'number.min': 'User ID must be a positive integer',
    }),

    sortBy: Joi.string().valid('createdAt', 'rating', 'category', 'status').default('createdAt').messages({
      'string.base': 'Sort by must be a string',
      'any.only': 'Invalid sort field',
    }),

    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC').messages({
      'string.base': 'Sort order must be a string',
      'any.only': 'Sort order must be ASC or DESC',
    }),
  }),

  // Query parameters validation for getUserFeedback
  getUserFeedback: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  }),
};

module.exports = feedbackValidation;
