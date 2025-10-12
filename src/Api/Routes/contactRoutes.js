// routes/contact.routes.js

const express = require('express');
const ContactController = require('../Controllers/ContactController');
const contactRouter = express.Router();

// Public route: Submit contact form
contactRouter
  .post('/', ContactController.createContact)

  // Admin routes
  .get('/', ContactController.getAllContacts) // List with filters, search, pagination
  .get('/:id', ContactController.getContactById) // View one
  .put('/:id', ContactController.updateContact) // Update contact (e.g. status, is_read)
  .delete('/:id', ContactController.deleteContact); // Delete contact

module.exports = contactRouter;
