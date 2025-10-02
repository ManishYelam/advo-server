const express = require('express');
const emailRouter = express.Router();
const emailController = require('../Controllers/email.Controller');

emailRouter
  // Route to send registration email
  .post('/send-registration-email/:userId', emailController.sendRegistrationEmail)

  .post('/send-password-change-email/:userId', emailController.sendPasswordChangeEmail)

  // Route to send performance tracking email
  .post('/send-performance-tracking-email/:userId', emailController.sendPerformanceTrackingEmail)

  // Route to send system logs email
  .post('/send-system-logs-email/:userId', emailController.sendSystemLogsEmail)

  // Route to send generic notification email
  .post('/send-notification-email/:userId', emailController.sendNotificationEmail);

module.exports = emailRouter;
