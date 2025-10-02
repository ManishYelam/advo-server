const emailService = require('../Services/email.Service');
const { User } = require('../models');

module.exports = {
  // Send registration email
  sendRegistrationEmail: async (req, res) => {
    const { userId } = req.params;

    try {
      await emailService.sendRegistrationEmail(userId);
      res.status(200).send('Registration email sent successfully.');
    } catch (error) {
      res.status(500).send(`Error sending registration email: ${error.message}`);
    }
  },

  // Send password change email
  sendPasswordChangeEmail: async (req, res) => {
    const { userId } = req.params;

    try {
      await emailService.sendPasswordChangeEmail(userId);
      res.status(200).send('Password change email sent successfully.');
    } catch (error) {
      res.status(500).send(`Error sending password change email: ${error.message}`);
    }
  },

  // Send performance tracking email
  sendPerformanceTrackingEmail: async (req, res) => {
    const { userId } = req.params;
    const { data } = req.body; // Expecting performance data in the request body

    try {
      await emailService.sendPerformanceTrackingEmail(userId, data);
      res.status(200).send('Performance tracking email sent successfully.');
    } catch (error) {
      res.status(500).send(`Error sending performance tracking email: ${error.message}`);
    }
  },

  // Send system logs email
  sendSystemLogsEmail: async (req, res) => {
    const { userId } = req.params;
    const { logData } = req.body; // Expecting log data in the request body

    try {
      await emailService.sendSystemLogsEmail(userId, logData);
      res.status(200).send('System logs email sent successfully.');
    } catch (error) {
      res.status(500).send(`Error sending system logs email: ${error.message}`);
    }
  },

  // Send generic notification email
  sendNotificationEmail: async (req, res) => {
    const { userId } = req.params;
    const { title, content } = req.body; // Expecting title and content in the request body

    try {
      await emailService.sendNotificationEmail(userId, title, content);
      res.status(200).send('Notification email sent successfully.');
    } catch (error) {
      res.status(500).send(`Error sending notification email: ${error.message}`);
    }
  },
};
