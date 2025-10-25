const { Op } = require('sequelize');
const Contact = require('../Models/Contacts');

const ContactService = {
  // 🟢 Create a new contact message
  createContact: async data => {
    try {
      const newContact = await Contact.create(data);
      return {
        success: true,
        message: 'Contact created successfully.',
        data: newContact,
      };
    } catch (error) {
      throw new Error('❌ Error creating contact: ' + error.message);
    }
  },

  // 🟢 Get all contact messages (with optional filters, search, pagination)
  getAllContacts: async ({
    page = 1,
    limit = 10,
    search = '',
    searchFields = ['name', 'email', 'message', 'subject'],
    filters = {},
  }) => {
    try {
      const offset = (page - 1) * limit;

      // Build where conditions dynamically
      let whereConditions = {};

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (['email', 'name', 'subject', 'priority'].includes(key)) {
            whereConditions[key] = { [Op.like]: `%${value}%` };
          } else {
            whereConditions[key] = value;
          }
        }
      });

      // Apply dynamic search
      let searchConditions =
        search && searchFields.length > 0 ? searchFields.map(field => ({ [field]: { [Op.like]: `%${search}%` } })) : [];

      // Combine filters + search
      let finalWhereCondition = { ...whereConditions };
      if (searchConditions.length > 0) {
        finalWhereCondition[Op.or] = searchConditions;
      }

      const { rows, count } = await Contact.findAndCountAll({
        where: finalWhereCondition,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      return {
        success: true,
        message: '✅ Contacts fetched successfully.',
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        data: rows,
      };
    } catch (error) {
      throw new Error(`❌ Error fetching contacts: ${error.message}`);
    }
  },

  // 🟢 Get a single contact message by ID
  getContactById: async id => {
    try {
      const contact = await Contact.findOne({ where: { id } });
      if (!contact) throw new Error('Contact not found');
      return {
        success: true,
        data: contact,
      };
    } catch (error) {
      throw new Error('❌ Error fetching contact: ' + error.message);
    }
  },

  // 🟢 Update contact (status, remarks, read flag, etc.)
  updateContact: async (id, data) => {
    try {
      const [count, updated] = await Contact.update(data, {
        where: { id },
        returning: true,
      });

      if (count === 0) throw new Error('Contact not found or no changes applied');
      return {
        success: true,
        message: '✅ Contact updated successfully.',
        data: updated[0],
      };
    } catch (error) {
      throw new Error('❌ Error updating contact: ' + error.message);
    }
  },

  // 🟢 Update admin remarks only
  updateContactRemarks: async (id, admin_remarks) => {
    try {
      if (!admin_remarks) throw new Error('Admin remarks are required.');

      const contact = await Contact.findByPk(id);
      if (!contact) throw new Error('Contact not found.');

      await contact.update({
        admin_remarks,
        is_read: true,
      });

      return {
        success: true,
        message: '✅ Admin remarks updated successfully.',
        data: contact,
      };
    } catch (error) {
      throw new Error('❌ Error updating admin remarks: ' + error.message);
    }
  },

  // 🟢 Update contact status (e.g., Pending → Reviewed → Resolved)
  updateContactStatus: async (id, updateData) => {
    try {
      const contact = await Contact.findByPk(id);
      if (!contact) throw new Error('Contact not found.');

      const { status, is_read, responded_at, handled_by_admin_id } = updateData;

      await contact.update({
        status,
        is_read,
        responded_at,
        handled_by_admin_id,
      });

      return {
        success: true,
        message: '✅ Contact status updated successfully.',
        data: contact,
      };
    } catch (error) {
      throw new Error('❌ Error updating contact status: ' + error.message);
    }
  },

  // 🟢 Delete a contact
  deleteContact: async id => {
    try {
      const deleted = await Contact.destroy({ where: { id } });
      if (!deleted) throw new Error('Contact not found');
      return {
        success: true,
        message: '🗑️ Contact deleted successfully.',
      };
    } catch (error) {
      throw new Error('❌ Error deleting contact: ' + error.message);
    }
  },

  // 🟢 Search contacts (separate search API)
  searchContacts: async (query, { page = 1, limit = 10 } = {}) => {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await Contact.findAndCountAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } },
            { message: { [Op.like]: `%${query}%` } },
            { subject: { [Op.like]: `%${query}%` } },
          ],
        },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      return {
        success: true,
        message: '✅ Contacts search completed successfully.',
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        data: rows,
      };
    } catch (error) {
      throw new Error('❌ Error searching contacts: ' + error.message);
    }
  },

  // 🟢 Get contact statistics
  getContactStats: async () => {
    try {
      const totalContacts = await Contact.count();
      const pendingContacts = await Contact.count({ where: { status: 'Pending' } });
      const reviewedContacts = await Contact.count({ where: { status: 'Reviewed' } });
      const resolvedContacts = await Contact.count({ where: { status: 'Resolved' } });
      const unreadContacts = await Contact.count({ where: { is_read: false } });

      const lowPriority = await Contact.count({ where: { priority: 'Low' } });
      const mediumPriority = await Contact.count({ where: { priority: 'Medium' } });
      const highPriority = await Contact.count({ where: { priority: 'High' } });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentContacts = await Contact.count({
        where: { createdAt: { [Op.gte]: sevenDaysAgo } },
      });

      return {
        success: true,
        message: '📊 Contact statistics fetched successfully.',
        data: {
          total: totalContacts,
          pending: pendingContacts,
          reviewed: reviewedContacts,
          resolved: resolvedContacts,
          unread: unreadContacts,
          priority: {
            low: lowPriority,
            medium: mediumPriority,
            high: highPriority,
          },
          recent: recentContacts,
        },
      };
    } catch (error) {
      throw new Error('❌ Error fetching contact statistics: ' + error.message);
    }
  },
};

module.exports = ContactService;
