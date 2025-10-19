module.exports = {
  // Create new support ticket
  createTicket: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { subject, category, priority, description, case_id, attachments } = req.body;

      const ticketData = {
        user_id: req.user.id,
        subject,
        category,
        priority,
        description,
        case_id,
        attachments,
      };

      const ticket = await supportService.createTicket(ticketData);

      res.status(201).json({
        success: true,
        message: 'Support ticket created successfully',
        data: { ticket },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get user's tickets
  getUserTickets: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, category, search } = req.query;

      const filters = { user_id: req.user.id };
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (search) filters.search = search;

      const result = await supportService.getTickets(filters, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get all tickets (admin/advocate)
  getAllTickets: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, category, priority, assigned_to, case_id, search } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (category) filters.category = category;
      if (priority) filters.priority = priority;
      if (assigned_to) filters.assigned_to = assigned_to;
      if (case_id) filters.case_id = case_id;
      if (search) filters.search = search;

      // If user is advocate, show only assigned tickets
      if (req.user.role === 'advocate') {
        filters.assigned_to = req.user.id;
      }

      const result = await supportService.getTickets(filters, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get single ticket
  getTicket: async (req, res) => {
    try {
      const { ticketId } = req.params;

      const ticket = await supportService.getTicketById(ticketId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      // Check if user owns the ticket or is admin/advocate
      if (ticket.user_id !== req.user.id && !['admin', 'advocate'].includes(req.user.role) && ticket.assigned_to !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: { ticket },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update ticket
  updateTicket: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const updateData = req.body;

      // Check if ticket exists and user has access
      const existingTicket = await supportService.getTicketById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      // Only admin/advocate can update assigned_to and status
      if (!['admin', 'advocate'].includes(req.user.role)) {
        delete updateData.assigned_to;
        delete updateData.status;
        delete updateData.priority;
      }

      // Only ticket owner or admin/advocate can update
      if (
        existingTicket.user_id !== req.user.id &&
        !['admin', 'advocate'].includes(req.user.role) &&
        existingTicket.assigned_to !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const ticket = await supportService.updateTicket(ticketId, updateData);

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: { ticket },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Delete ticket (admin only)
  deleteTicket: async (req, res) => {
    try {
      const { ticketId } = req.params;

      const result = await supportService.deleteTicket(ticketId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Add message to ticket
  addMessage: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { message, is_internal = false } = req.body;

      // Check if ticket exists and user has access
      const ticket = await supportService.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      if (ticket.user_id !== req.user.id && !['admin', 'advocate'].includes(req.user.role) && ticket.assigned_to !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const messageData = {
        ticket_id: parseInt(ticketId),
        user_id: req.user.id,
        message,
        is_internal,
      };

      const newMessage = await supportService.addMessage(messageData);

      res.status(201).json({
        success: true,
        message: 'Message added successfully',
        data: { message: newMessage },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get ticket messages
  getTicketMessages: async (req, res) => {
    try {
      const { ticketId } = req.params;

      // Check if ticket exists and user has access
      const ticket = await supportService.getTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      if (ticket.user_id !== req.user.id && !['admin', 'advocate'].includes(req.user.role) && ticket.assigned_to !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const messages = await supportService.getTicketMessages(ticketId);

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get FAQs
  getFAQs: async (req, res) => {
    try {
      const { category } = req.query;

      const filters = {};
      if (category) filters.category = category;

      const faqs = await supportService.getFAQs(filters);

      res.json({
        success: true,
        data: { faqs },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Create FAQ (admin)
  createFAQ: async (req, res) => {
    try {
      const { question, answer, category, order } = req.body;

      const faqData = {
        question,
        answer,
        category,
        order,
        created_by: req.user.id,
      };

      const faq = await supportService.createFAQ(faqData);

      res.status(201).json({
        success: true,
        message: 'FAQ created successfully',
        data: { faq },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Update FAQ (admin)
  updateFAQ: async (req, res) => {
    try {
      const { faqId } = req.params;
      const updateData = req.body;

      const faq = await supportService.updateFAQ(faqId, updateData);

      res.json({
        success: true,
        message: 'FAQ updated successfully',
        data: { faq },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Delete FAQ (admin)
  deleteFAQ: async (req, res) => {
    try {
      const { faqId } = req.params;

      const result = await supportService.deleteFAQ(faqId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get support statistics
  getStats: async (req, res) => {
    try {
      const stats = await supportService.getSupportStats(req.user.id, req.user.role);

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get case support tickets
  getCaseTickets: async (req, res) => {
    try {
      const { caseId } = req.params;

      // Check if user has access to the case
      // You might want to add case access validation here

      const tickets = await supportService.getCaseSupportTickets(caseId);

      res.json({
        success: true,
        data: { tickets },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get user support history
  getUserSupportHistory: async (req, res) => {
    try {
      const { userId } = req.params;

      // Users can only see their own history, admins/advocates can see any
      if (userId != req.user.id && !['admin', 'advocate'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const history = await supportService.getUserSupportHistory(userId);

      res.json({
        success: true,
        data: { history },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
