 // controllers/contactController.js
const ContactService = require('../Services/ContactService');

const ContactController = {
   // User: Submit a contact message
  createContact: async (req, res) => {
    try {
      const contact = await ContactService.createContact(req.body);
      res.status(201).json({
        success: true,
        message: 'Message sent successfully.',
        data: contact,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating contact message.',
        error: error.message,
      });
    }
  },

  // 🟢 Get all contacts with pagination, filtering, and search
  getAllContacts: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', ...filters } = req.query;

      const result = await ContactService.getAllContacts({
        page,
        limit,
        search,
        filters,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in getAllContacts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contacts.',
        error: error.message,
      });
    }
  },

  // 🟢 Get single contact by ID
  getContactById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ContactService.getContactById(id);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in getContactById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact.',
        error: error.message,
      });
    }
  },


  // 🟢 Update contact details (status, remarks, etc.)
  updateContact: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const result = await ContactService.updateContact(id, data);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in updateContact:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update contact.',
        error: error.message,
      });
    }
  },

  // 🟢 Update contact status
  updateContactStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, is_read, responded_at, handled_by_admin_id } = req.body;

      const result = await ContactService.updateContactStatus(id, {
        status,
        is_read,
        responded_at,
        handled_by_admin_id,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in updateContactStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update contact status.',
        error: error.message,
      });
    }
  },

  // 🟢 Update admin remarks
  updateContactRemarks: async (req, res) => {
    try {
      const { id } = req.params;
      const { admin_remarks } = req.body;

      const result = await ContactService.updateContactRemarks(id, admin_remarks);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in updateContactRemarks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update admin remarks.',
        error: error.message,
      });
    }
  },

  // 🟢 Delete a contact
  deleteContact: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ContactService.deleteContact(id);
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in deleteContact:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete contact.',
        error: error.message,
      });
    }
  },

  // 🟢 Search contacts
  searchContacts: async (req, res) => {
    try {
      const { q: query, page = 1, limit = 10 } = req.query;
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required.',
        });
      }

      const result = await ContactService.searchContacts(query, { page, limit });
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in searchContacts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search contacts.',
        error: error.message,
      });
    }
  },

  // 🟢 Get contact statistics
  getContactStats: async (req, res) => {
    try {
      const result = await ContactService.getContactStats();
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error in getContactStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact statistics.',
        error: error.message,
      });
    }
  },
};

module.exports = ContactController;
