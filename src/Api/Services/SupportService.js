const { Op, Sequelize } = require('sequelize');
const { SupportTicket, User, Cases, TicketMessage, TicketAttachment, FAQ } = require('../Models/Association');
const sequelize = require('../../Config/Database/sequelize.config');

module.exports = {
  // Ticket Methods
    createTicket: async ticketData => {
    const transaction = await sequelize.MAIN_DB_NAME.transaction();
    
    try {
      // console.log('Creating ticket with data:', ticketData);

      // Handle case_id - set to null if empty, undefined, or invalid
      let finalCaseId = null;
      if (ticketData.case_id && Number.isInteger(Number(ticketData.case_id))) {
        const caseId = parseInt(ticketData.case_id, 10);
        
        // Check if case exists
        const caseExists = await Cases.findByPk(caseId, { transaction });
        if (caseExists) {
          finalCaseId = caseId;
          // console.log('Valid case ID found:', finalCaseId);
        } else {
          // console.log('Case ID not found, setting to null');
          finalCaseId = null;
        }
      }

      // Prepare the final ticket data
      const finalTicketData = {
        user_id: ticketData.user_id,
        subject: ticketData.subject,
        category: ticketData.category,
        priority: ticketData.priority,
        description: ticketData.description,
        case_id: finalCaseId, // This will be null if invalid or not provided
        attachments: ticketData.attachments || null,
        assigned_to: ticketData.assigned_to || null
      };

      // console.log('Final ticket data for creation:', finalTicketData);

      // Create the ticket - let the model hooks handle ticket_number generation
      const ticket = await SupportTicket.create(finalTicketData, { transaction });
      
      console.log('Ticket created successfully:', {
        id: ticket.support_ticket_id,
        ticket_number: ticket.ticket_number,
        case_id: ticket.case_id
      });
      
      // Commit transaction
      await transaction.commit();
      
      // Return the created ticket with associations
      return await SupportTicket.findByPk(ticket.support_ticket_id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone_number'],
          },
          {
            model: User,
            as: 'assigned_agent',
            attributes: ['id', 'full_name', 'email'],
          },
          {
            model: Cases,
            as: 'related_case',
            attributes: ['id', 'case_number', 'title'],
          },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in createTicket:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        errorMessage = 'Invalid user or case reference. Please check the provided IDs.';
      } else if (error.name === 'SequelizeValidationError') {
        errorMessage = 'Validation failed: ' + error.errors.map(e => e.message).join(', ');
      }
      
      throw new Error(`Failed to create ticket: ${errorMessage}`);
    }
  },

  getTickets: async (filters = {}, page = 1, limit = 10) => {
    try {
      const whereClause = {};

      // Apply filters
      if (filters.user_id) whereClause.user_id = filters.user_id;
      if (filters.status) whereClause.status = filters.status;
      if (filters.category) whereClause.category = filters.category;
      if (filters.priority) whereClause.priority = filters.priority;
      if (filters.case_id) whereClause.case_id = filters.case_id;
      if (filters.assigned_to) whereClause.assigned_to = filters.assigned_to;
      if (filters.search) {
        whereClause[Op.or] = [
          { subject: { [Op.like]: `%${filters.search}%` } },
          { ticket_number: { [Op.like]: `%${filters.search}%` } },
          { description: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await SupportTicket.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone_number'],
          },
          {
            model: User,
            as: 'assigned_agent',
            attributes: ['id', 'full_name', 'email'],
          },
          {
            model: Cases,
            as: 'related_case',
            attributes: ['id', 'case_number', 'title'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      return {
        tickets: rows,
        total: count,
        page,
        total_pages: Math.ceil(count / limit),
      };
    } catch (error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }
  },

  getTicketById: async ticketId => {
    try {
      return await SupportTicket.findByPk(ticketId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone_number', 'role'],
          },
          {
            model: User,
            as: 'assigned_agent',
            attributes: ['id', 'full_name', 'email', 'role'],
          },
          {
            model: Cases,
            as: 'related_case',
            attributes: ['id', 'case_number', 'title', 'status'],
          },
          {
            model: TicketMessage,
            as: 'messages',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'role'],
              },
              {
                model: TicketAttachment,
                as: 'attachments',
                attributes: ['ticket_attachment_id', 'filename', 'original_name', 'mime_type', 'size'],
              },
            ],
            order: [['created_at', 'ASC']],
          },
          {
            model: TicketAttachment,
            as: 'ticket_attachments',
            attributes: ['ticket_attachment_id', 'filename', 'original_name', 'mime_type', 'size'],
          },
        ],
      });
    } catch (error) {
      throw new Error(`Failed to fetch ticket: ${error.message}`);
    }
  },

  updateTicket: async (ticketId, updateData) => {
    try {
      const ticket = await SupportTicket.findByPk(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // If status is being updated to resolved/closed, set resolved_at
      if (updateData.status && ['resolved', 'closed'].includes(updateData.status)) {
        updateData.resolved_at = new Date();
      }

      await ticket.update(updateData);
      return await this.getTicketById(ticketId);
    } catch (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }
  },

  deleteTicket: async ticketId => {
    try {
      const ticket = await SupportTicket.findByPk(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      await ticket.destroy();
      return { message: 'Ticket deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  },

  // Message Methods
  addMessage: async messageData => {
    try {
      const message = await TicketMessage.create(messageData);
      return await TicketMessage.findByPk(message.ticket_message_id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'role'],
          },
          {
            model: TicketAttachment,
            as: 'attachments',
            attributes: ['ticket_attachment_id', 'filename', 'original_name', 'mime_type', 'size'],
          },
        ],
      });
    } catch (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }
  },

  getTicketMessages: async ticketId => {
    try {
      return await TicketMessage.findAll({
        where: { ticket_id: ticketId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'role'],
          },
          {
            model: TicketAttachment,
            as: 'attachments',
            attributes: ['ticket_attachment_id', 'filename', 'original_name', 'mime_type', 'size'],
          },
        ],
        order: [['created_at', 'ASC']],
      });
    } catch (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  },

  updateMessage: async (messageId, updateData) => {
    try {
      const message = await TicketMessage.findByPk(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      await message.update(updateData);
      return await TicketMessage.findByPk(messageId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'role'],
          },
        ],
      });
    } catch (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }
  },

  deleteMessage: async messageId => {
    try {
      const message = await TicketMessage.findByPk(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      await message.destroy();
      return { message: 'Message deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  },

  // FAQ Methods
  getFAQs: async (filters = {}) => {
    try {
      const whereClause = { is_active: true };

      if (filters.category) {
        whereClause.category = filters.category;
      }

      return await FAQ.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'full_name'],
          },
        ],
        order: [
          ['order', 'ASC'],
          ['created_at', 'DESC'],
        ],
      });
    } catch (error) {
      throw new Error(`Failed to fetch FAQs: ${error.message}`);
    }
  },

  createFAQ: async faqData => {
    try {
      const faq = await FAQ.create(faqData);
      return await FAQ.findByPk(faq.faq_id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'full_name'],
          },
        ],
      });
    } catch (error) {
      throw new Error(`Failed to create FAQ: ${error.message}`);
    }
  },

  updateFAQ: async (faqId, updateData) => {
    try {
      const faq = await FAQ.findByPk(faqId);
      if (!faq) {
        throw new Error('FAQ not found');
      }

      await faq.update(updateData);
      return await FAQ.findByPk(faqId, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'full_name'],
          },
        ],
      });
    } catch (error) {
      throw new Error(`Failed to update FAQ: ${error.message}`);
    }
  },

  deleteFAQ: async faqId => {
    try {
      const faq = await FAQ.findByPk(faqId);
      if (!faq) {
        throw new Error('FAQ not found');
      }

      await faq.destroy();
      return { message: 'FAQ deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete FAQ: ${error.message}`);
    }
  },

  // Statistics
  getSupportStats: async (userId = null, userRole = null) => {
    try {
      const whereClause = {};

      // If user is not admin, only show their tickets
      if (userRole !== 'admin' && userId) {
        whereClause.user_id = userId;
      }

      const totalTickets = await SupportTicket.count({ where: whereClause });
      const openTickets = await SupportTicket.count({
        where: { ...whereClause, status: 'open' },
      });
      const inProgressTickets = await SupportTicket.count({
        where: { ...whereClause, status: 'in_progress' },
      });
      const resolvedTickets = await SupportTicket.count({
        where: { ...whereClause, status: 'resolved' },
      });

      const ticketsByCategory = await SupportTicket.findAll({
        attributes: ['category', [Sequelize
          .fn('COUNT', Sequelize.col('support_ticket_id')), 'count']],
        where: whereClause,
        group: ['category'],
      });

      const ticketsByPriority = await SupportTicket.findAll({
        attributes: ['priority', [Sequelize.fn('COUNT', Sequelize.col('support_ticket_id')), 'count']],
        where: whereClause,
        group: ['priority'],
      });

      return {
        total_tickets: totalTickets,
        open_tickets: openTickets,
        in_progress_tickets: inProgressTickets,
        resolved_tickets: resolvedTickets,
        tickets_by_category: ticketsByCategory,
        tickets_by_priority: ticketsByPriority,
      };
    } catch (error) {
      throw new Error(`Failed to fetch support stats: ${error.message}`);
    }
  },

  // Case-related support methods
  getCaseSupportTickets: async caseId => {
    try {
      return await SupportTicket.findAll({
        where: { case_id: caseId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email'],
          },
          {
            model: TicketMessage,
            as: 'messages',
            attributes: ['ticket_message_id', 'message', 'created_at'],
            limit: 1,
            order: [['created_at', 'DESC']],
          },
        ],
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      throw new Error(`Failed to fetch case tickets: ${error.message}`);
    }
  },

  // User-related support methods
  getUserSupportHistory: async userId => {
    try {
      return await SupportTicket.findAll({
        where: { user_id: userId },
        include: [
          {
            model: User,
            as: 'assigned_agent',
            attributes: ['id', 'full_name', 'email'],
          },
          {
            model: Cases,
            as: 'related_case',
            attributes: ['id', 'case_number', 'title'],
          },
          {
            model: TicketMessage,
            as: 'messages',
            attributes: ['ticket_message_id'],
            limit: 1,
          },
        ],
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      throw new Error(`Failed to fetch user support history: ${error.message}`);
    }
  },
};
