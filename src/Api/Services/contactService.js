const { Op } = require('sequelize');
const Contact = require('../Models/Contacts');

const ContactService = {
  // Create a new contact message
  createContact: async data => {
    try {
      const newContact = await Contact.create(data);
      return newContact;
    } catch (error) {
      throw new Error('Error creating contact: ' + error.message);
    }
  },

  // Get all contact messages (with optional filters, search, pagination)
  getAllContacts: async ({ page = 1, limit = 10, search = '', searchFields = [], filters = {} }) => {
    try {
      const offset = (page - 1) * limit;

      let whereConditions = {};

      // Apply filters
      if (filters.status) whereConditions.status = filters.status;
      if (filters.priority) whereConditions.priority = filters.priority;
      if (filters.is_read !== undefined) whereConditions.is_read = filters.is_read;
      if (filters.email) whereConditions.email = { [Op.like]: `%${filters.email}%` };
      if (filters.name) whereConditions.name = { [Op.like]: `%${filters.name}%` };

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
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        message: '✅ Contacts fetched successfully.',
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows,
      };
    } catch (error) {
      throw new Error(`❌ Error in getAllContacts: ${error.message}`);
    }
  },

  // Get a single contact message by ID
  getContactById: async id => {
    try {
      const contact = await Contact.findOne({ where: { id } });
      if (!contact) throw new Error('Contact not found');
      return contact;
    } catch (error) {
      throw new Error('Error fetching contact: ' + error.message);
    }
  },

  // Update contact (e.g. admin remarks, status)
  updateContact: async (id, data) => {
    try {
      const [count, updated] = await Contact.update(data, {
        where: { id },
        returning: true,
      });

      if (count === 0) throw new Error('Contact not found or no changes applied');
      return updated[0]; // Return the updated contact
    } catch (error) {
      throw new Error('Error updating contact: ' + error.message);
    }
  },

  // Delete contact message
  deleteContact: async id => {
    try {
      const deleted = await Contact.destroy({ where: { id } });
      if (!deleted) throw new Error('Contact not found');
      return deleted;
    } catch (error) {
      throw new Error('Error deleting contact: ' + error.message);
    }
  },
};

module.exports = ContactService;
