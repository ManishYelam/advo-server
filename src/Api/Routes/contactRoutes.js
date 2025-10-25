// routes/contact.routes.js

const express = require('express');
const ContactController = require('../Controllers/ContactController');
const contactRouter = express.Router();

// Public route: Submit contact form
contactRouter
  .post('/', ContactController.createContact)

  // Admin routes
  .get('/', ContactController.getAllContacts) // List contacts with filters, search, pagination
  .get('/stats', ContactController.getContactStats) // Contact statistics
  .get('/search', ContactController.searchContacts) // Search contacts
  .get('/:id', ContactController.getContactById) // View specific contact
  .put('/:id/status', ContactController.updateContactStatus) // Update status, is_read, handled_by_admin_id, etc.
  .put('/:id/remarks', ContactController.updateContactRemarks) // Update admin remarks
  .delete('/:id', ContactController.deleteContact); // Delete a contact

module.exports = contactRouter;
