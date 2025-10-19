// services/supportService.js
const { Op } = require('sequelize');

class SupportService {
  constructor(models) {
    this.models = models;
  }

  // Ticket Methods
  async createTicket(ticketData) {
    try {
      const ticket = await this.models.SupportTicket.create(ticketData);
      return await this.models.SupportTicket.findByPk(ticket.support_ticket_id, {
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone_number']
          },
          {
            model: this.models.User,
            as: 'assigned_agent',
            attributes: ['id', 'full_name', 'email']
          },
          {
            model: this.models.Cases,
            as: 'related_case',
            attributes: ['id', 'case_number', 'title']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  async getTickets(filters = {}, page = 1, limit = 10) {
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
          { description: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await this.models.SupportTicket.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone_number']
          },
          {
            model: this.models.User,
            as: 'assigned_agent',
            attributes: ['id', 'full_name', 'email']
          },
          {
            model: this.models.Cases,
            as: 'related_case',
            attributes: ['id', 'case_number', 'title']
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        tickets: rows,
        total: count,
        page,
        total_pages: Math.ceil(count / limit)
      };
    } catch (error) {
      throw new Error(`Failed to fetch tickets: ${error.message}`);
    }
  }

  async getTicketById(ticketId) {
    try {
      return await this.models.SupportTicket.findByPk(ticketId, {
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone_number', 'role']
          },
          {
            model: this.models.User,
            as: 'assigned_agent',
            attributes: ['id', 'full_name', 'email', 'role']
          },
          {
            model: this.models.Cases,
            as: 'related_case',
            attributes: ['id', 'case_number', 'title', 'status']
          },
          {
            model: this.models.TicketMessage,
            as: 'messages',
            include: [
              {
                model: this.models.User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'role']
              },
              {
                model: this.models.TicketAttachment,
                as: 'attachments',
                attributes: ['ticket_attachment_id', 'filename', 'original_name', 'mime_type', 'size']
              }
            ],
            order: [['created_at', 'ASC']]
          },
          {
            model: this.models.TicketAttachment,
            as: 'ticket_attachments',
            attributes: ['ticket_attachment_id', 'filename', 'original_name', 'mime_type', 'size']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Failed to fetch ticket: ${error.message}`);
    }
  }

  async updateTicket(ticketId, updateData) {
    try {
      const ticket = await this.models.SupportTicket.findByPk(ticketId);
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
  }

  async deleteTicket(ticketId) {
    try {
      const ticket = await this.models.SupportTicket.findByPk(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      await ticket.destroy();
      return { message: 'Ticket deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete ticket: ${error.message}`);
    }
  }

  // Message Methods
  async addMessage(messageData) {
    try {
      const message = await this.models.TicketMessage.create(messageData);
      return await this.models.TicketMessage.findByPk(message.ticket_message_id, {
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'role']
          },
          {
            model: this.models.TicketAttachment,
            as: 'attachments',
            attributes: ['ticket_attachment_id', 'filename', 'original_name', 'mime_type', 'size']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }
  }

  async getTicketMessages(ticketId) {
    try {
      return await this.models.TicketMessage.findAll({
        where: { ticket_id: ticketId },
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'role']
          },
          {
            model: this.models.TicketAttachment,
            as: 'attachments',
            attributes: ['ticket_attachment_id', 'filename', 'original_name', 'mime_type', 'size']
          }
        ],
        order: [['created_at', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }

  async updateMessage(messageId, updateData) {
    try {
      const message = await this.models.TicketMessage.findByPk(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      await message.update(updateData);
      return await this.models.TicketMessage.findByPk(messageId, {
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'role']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Failed to update message: ${error.message}`);
    }
  }

  async deleteMessage(messageId) {
    try {
      const message = await this.models.TicketMessage.findByPk(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      await message.destroy();
      return { message: 'Message deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  // FAQ Methods
  async getFAQs(filters = {}) {
    try {
      const whereClause = { is_active: true };
      
      if (filters.category) {
        whereClause.category = filters.category;
      }

      return await this.models.FAQ.findAll({
        where: whereClause,
        include: [
          {
            model: this.models.User,
            as: 'author',
            attributes: ['id', 'full_name']
          }
        ],
        order: [['order', 'ASC'], ['created_at', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Failed to fetch FAQs: ${error.message}`);
    }
  }

  async createFAQ(faqData) {
    try {
      const faq = await this.models.FAQ.create(faqData);
      return await this.models.FAQ.findByPk(faq.faq_id, {
        include: [
          {
            model: this.models.User,
            as: 'author',
            attributes: ['id', 'full_name']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Failed to create FAQ: ${error.message}`);
    }
  }

  async updateFAQ(faqId, updateData) {
    try {
      const faq = await this.models.FAQ.findByPk(faqId);
      if (!faq) {
        throw new Error('FAQ not found');
      }

      await faq.update(updateData);
      return await this.models.FAQ.findByPk(faqId, {
        include: [
          {
            model: this.models.User,
            as: 'author',
            attributes: ['id', 'full_name']
          }
        ]
      });
    } catch (error) {
      throw new Error(`Failed to update FAQ: ${error.message}`);
    }
  }

  async deleteFAQ(faqId) {
    try {
      const faq = await this.models.FAQ.findByPk(faqId);
      if (!faq) {
        throw new Error('FAQ not found');
      }

      await faq.destroy();
      return { message: 'FAQ deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete FAQ: ${error.message}`);
    }
  }

  // Statistics
  async getSupportStats(userId = null, userRole = null) {
    try {
      const whereClause = {};
      
      // If user is not admin, only show their tickets
      if (userRole !== 'admin' && userId) {
        whereClause.user_id = userId;
      }

      const totalTickets = await this.models.SupportTicket.count({ where: whereClause });
      const openTickets = await this.models.SupportTicket.count({ 
        where: { ...whereClause, status: 'open' } 
      });
      const inProgressTickets = await this.models.SupportTicket.count({ 
        where: { ...whereClause, status: 'in_progress' } 
      });
      const resolvedTickets = await this.models.SupportTicket.count({ 
        where: { ...whereClause, status: 'resolved' } 
      });

      const ticketsByCategory = await this.models.SupportTicket.findAll({
        attributes: [
          'category',
          [this.models.sequelize.fn('COUNT', this.models.sequelize.col('support_ticket_id')), 'count']
        ],
        where: whereClause,
        group: ['category']
      });

      const ticketsByPriority = await this.models.SupportTicket.findAll({
        attributes: [
          'priority',
          [this.models.sequelize.fn('COUNT', this.models.sequelize.col('support_ticket_id')), 'count']
        ],
        where: whereClause,
        group: ['priority']
      });

      return {
        total_tickets: totalTickets,
        open_tickets: openTickets,
        in_progress_tickets: inProgressTickets,
        resolved_tickets: resolvedTickets,
        tickets_by_category: ticketsByCategory,
        tickets_by_priority: ticketsByPriority
      };
    } catch (error) {
      throw new Error(`Failed to fetch support stats: ${error.message}`);
    }
  }

  // Case-related support methods
  async getCaseSupportTickets(caseId) {
    try {
      return await this.models.SupportTicket.findAll({
        where: { case_id: caseId },
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'full_name', 'email']
          },
          {
            model: this.models.TicketMessage,
            as: 'messages',
            attributes: ['ticket_message_id', 'message', 'created_at'],
            limit: 1,
            order: [['created_at', 'DESC']]
          }
        ],
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Failed to fetch case tickets: ${error.message}`);
    }
  }

  // User-related support methods
  async getUserSupportHistory(userId) {
    try {
      return await this.models.SupportTicket.findAll({
        where: { user_id: userId },
        include: [
          {
            model: this.models.User,
            as: 'assigned_agent',
            attributes: ['id', 'full_name', 'email']
          },
          {
            model: this.models.Cases,
            as: 'related_case',
            attributes: ['id', 'case_number', 'title']
          },
          {
            model: this.models.TicketMessage,
            as: 'messages',
            attributes: ['ticket_message_id'],
            limit: 1
          }
        ],
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Failed to fetch user support history: ${error.message}`);
    }
  }
}

module.exports = SupportService;