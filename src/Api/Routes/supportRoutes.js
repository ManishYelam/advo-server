const express = require('express');
const supportRouter = express.Router();
const Joi = require('joi');
const validate = require('../Middlewares/validateMiddleware');
const authMiddleware = require('../Middlewares/authorizationMiddleware');

// Joi Validation Schemas
const ticketSchema = Joi.object({
  subject: Joi.string().required().messages({
    'any.required': 'Subject is required',
    'string.empty': 'Subject cannot be empty'
  }),
  category: Joi.string().valid('general', 'technical', 'billing', 'feature', 'bug', 'case_related').required().messages({
    'any.only': 'Invalid category',
    'any.required': 'Category is required'
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').required().messages({
    'any.only': 'Invalid priority',
    'any.required': 'Priority is required'
  }),
  description: Joi.string().required().messages({
    'any.required': 'Description is required',
    'string.empty': 'Description cannot be empty'
  }),
  case_id: Joi.number().integer().optional().messages({
    'number.base': 'Case ID must be an integer'
  })
});

const ticketUpdateSchema = Joi.object({
  subject: Joi.string().optional().empty('').messages({
    'string.empty': 'Subject cannot be empty'
  }),
  category: Joi.string().valid('general', 'technical', 'billing', 'feature', 'bug', 'case_related').optional().messages({
    'any.only': 'Invalid category'
  }),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional().messages({
    'any.only': 'Invalid priority'
  }),
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional().messages({
    'any.only': 'Invalid status'
  }),
  assigned_to: Joi.number().integer().optional().messages({
    'number.base': 'Assigned to must be an integer'
  })
}).min(1); // At least one field should be present

const messageSchema = Joi.object({
  message: Joi.string().required().messages({
    'any.required': 'Message is required',
    'string.empty': 'Message cannot be empty'
  }),
  is_internal: Joi.boolean().optional().messages({
    'boolean.base': 'is_internal must be a boolean'
  })
});

const faqSchema = Joi.object({
  question: Joi.string().required().messages({
    'any.required': 'Question is required',
    'string.empty': 'Question cannot be empty'
  }),
  answer: Joi.string().required().messages({
    'any.required': 'Answer is required',
    'string.empty': 'Answer cannot be empty'
  }),
  category: Joi.string().valid('general', 'technical', 'billing', 'account', 'case_management').required().messages({
    'any.only': 'Invalid category',
    'any.required': 'Category is required'
  }),
  order: Joi.number().integer().optional().messages({
    'number.base': 'Order must be an integer'
  })
});

// Query parameter schemas
const faqQuerySchema = Joi.object({
  category: Joi.string().valid('general', 'technical', 'billing', 'account', 'case_management').optional()
});

const ticketQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
  category: Joi.string().valid('general', 'technical', 'billing', 'feature', 'bug', 'case_related').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  assigned_to: Joi.number().integer().optional(),
  case_id: Joi.number().integer().optional()
});

// Parameter validation schemas
const idParamSchema = Joi.object({
  ticketId: Joi.number().integer().required().messages({
    'number.base': 'Invalid ticket ID',
    'any.required': 'Ticket ID is required'
  })
});

const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().required().messages({
    'number.base': 'Invalid user ID',
    'any.required': 'User ID is required'
  })
});

const caseIdParamSchema = Joi.object({
  caseId: Joi.number().integer().required().messages({
    'number.base': 'Invalid case ID',
    'any.required': 'Case ID is required'
  })
});

const faqIdParamSchema = Joi.object({
  faqId: Joi.number().integer().required().messages({
    'number.base': 'Invalid FAQ ID',
    'any.required': 'FAQ ID is required'
  })
});


// Public routes (no authentication required)
supportRouter
  .get('/faqs',
    validate(faqQuerySchema, 'query'),
    supportController.getFAQs
  )

  // Apply authentication middleware to all subsequent routes
  .use(authMiddleware)

  // Client routes (accessible to all authenticated users - client, advocate, admin)
  .post('/tickets',
    validate(ticketSchema),
    supportController.createTicket
  )

  .get('/tickets/user', supportController.getUserTickets)
  .get('/tickets/stats', supportController.getStats)

  .get('/tickets/:ticketId',
    validate(idParamSchema, 'params'),
    supportController.getTicket
  )

  .put('/tickets/:ticketId',
    validate(idParamSchema, 'params'),
    validate(ticketUpdateSchema),
    supportController.updateTicket
  )

  // Message routes (accessible to all authenticated users)
  .post('/tickets/:ticketId/messages',
    validate(idParamSchema, 'params'),
    validate(messageSchema),
    supportController.addMessage
  )

  .get('/tickets/:ticketId/messages',
    validate(idParamSchema, 'params'),
    supportController.getTicketMessages
  )

  // User support history (accessible to user themselves, advocates, and admins)
  .get('/users/:userId/support-history',
    validate(userIdParamSchema, 'params'),
    supportController.getUserSupportHistory
  )

  // Case support tickets (accessible to case participants, advocates, and admins)
  .get('/cases/:caseId/tickets',
    validate(caseIdParamSchema, 'params'),
    supportController.getCaseTickets
  )

  // Advocate routes (accessible to advocates and admins)
  .get('/tickets',
    validate(ticketQuerySchema, 'query'),
    roleMiddleware(['admin', 'advocate']),
    supportController.getAllTickets
  )

  // Admin only routes
  .delete('/tickets/:ticketId',
    validate(idParamSchema, 'params'),
    roleMiddleware(['admin']),
    supportController.deleteTicket
  )

  .post('/faqs',
    validate(faqSchema),
    roleMiddleware(['admin']),
    supportController.createFAQ
  )

  .put('/faqs/:faqId',
    validate(faqIdParamSchema, 'params'),
    validate(faqSchema),
    roleMiddleware(['admin']),
    supportController.updateFAQ
  )

  .delete('/faqs/:faqId',
    validate(faqIdParamSchema, 'params'),
    roleMiddleware(['admin']),
    supportController.deleteFAQ
  )

module.exports = supportRouter;