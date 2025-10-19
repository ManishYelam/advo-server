const express = require('express');
const supportRouter = express.Router();
const Joi = require('joi');
const validate = require('../Middlewares/validateMiddleware');
const roleMiddleware = require('../Middlewares/roleAuth');
const authMiddleware = require('../Middlewares/authorizationMiddleware');
const SupportController = require('../Controllers/SupportController');
const {
  ticketSchema,
  ticketUpdateSchema,
  messageSchema,
  faqSchema,
  faqQuerySchema,
  ticketQuerySchema,
  idParamSchema,
  userIdParamSchema,
  caseIdParamSchema,
  faqIdParamSchema,
} = require('../Middlewares/Joi_Validations/supportSchema');

// Public routes (no authentication required)
supportRouter
  .get('/faqs', validate(faqQuerySchema, 'query'), SupportController.getFAQs)

  // Apply authentication middleware to all subsequent routes
  .use(authMiddleware)

  // Client routes (accessible to all authenticated users - client, advocate, admin)
  .post('/tickets', validate(ticketSchema), SupportController.createTicket)

  .get('/tickets/user', SupportController.getUserTickets)
  .get('/tickets/stats', SupportController.getStats)

  .get('/tickets/:ticketId', validate(idParamSchema, 'params'), SupportController.getTicket)

  .put('/tickets/:ticketId', validate(idParamSchema, 'params'), validate(ticketUpdateSchema), SupportController.updateTicket)

  // Message routes (accessible to all authenticated users)
  .post('/tickets/:ticketId/messages', validate(idParamSchema, 'params'), validate(messageSchema), SupportController.addMessage)

  .get('/tickets/:ticketId/messages', validate(idParamSchema, 'params'), SupportController.getTicketMessages)

  // User support history (accessible to user themselves, advocates, and admins)
  .get('/users/:userId/support-history', validate(userIdParamSchema, 'params'), SupportController.getUserSupportHistory)

  // Case support tickets (accessible to case participants, advocates, and admins)
  .get('/cases/:caseId/tickets', validate(caseIdParamSchema, 'params'), SupportController.getCaseTickets)

  // Advocate routes (accessible to advocates and admins)
  .get('/tickets', validate(ticketQuerySchema, 'query'), roleMiddleware(['admin', 'advocate']), SupportController.getAllTickets)

  // Admin only routes
  .delete('/tickets/:ticketId', validate(idParamSchema, 'params'), roleMiddleware(['admin']), SupportController.deleteTicket)

  .post('/faqs', validate(faqSchema), roleMiddleware(['admin']), SupportController.createFAQ)

  .put(
    '/faqs/:faqId',
    validate(faqIdParamSchema, 'params'),
    validate(faqSchema),
    roleMiddleware(['admin']),
    SupportController.updateFAQ
  )

  .delete('/faqs/:faqId', validate(faqIdParamSchema, 'params'), roleMiddleware(['admin']), SupportController.deleteFAQ);

module.exports = supportRouter;
