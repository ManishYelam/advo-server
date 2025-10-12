// controllers/ContactController.js

const ContactService = require('../Services/contactService');

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

  // Admin: Get all contact messages with filters/search/pagination
  getAllContacts: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', searchFields = '', ...filters } = req.query;

      const searchFieldsArray = searchFields ? searchFields.split(',') : [];

      const contacts = await ContactService.getAllContacts({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        searchFields: searchFieldsArray,
        filters,
      });

      res.status(200).json({
        success: true,
        ...contacts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching contacts.',
        error: error.message,
      });
    }
  },

  // Admin: Get a single contact message by ID
  getContactById: async (req, res) => {
    try {
      const contact = await ContactService.getContactById(req.params.id);
      res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Contact not found.',
        error: error.message,
      });
    }
  },

  // Admin: Update a contact message (status, remarks, etc.)
  updateContact: async (req, res) => {
    try {
      const updated = await ContactService.updateContact(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Contact updated successfully.',
        data: updated,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating contact.',
        error: error.message,
      });
    }
  },

  // Admin: Delete a contact message
  deleteContact: async (req, res) => {
    try {
      await ContactService.deleteContact(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Contact deleted successfully.',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting contact.',
        error: error.message,
      });
    }
  },
};

module.exports = ContactController;
