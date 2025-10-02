const nodemailer = require('nodemailer');
const emailTemplates = require('../../Api/EmailTemplets/Templates');
const { ApplicationProperties } = require('../../Api/Models/Association');

const Transporter = settings => {
  return nodemailer.createTransport({
    service: settings.metadata.emailSettings.service,
    auth: {
      user: settings.metadata.emailSettings.username,
      pass: settings.metadata.emailSettings.password,
    },
  });
};

const sendMail = async (to, subject, templateName, templateData = {}, attachments = []) => {
  try {
    const app_email = await ApplicationProperties.findOne({
      where: { property_name: 'app_email', status: 'active' },
    });
    const settings = app_email ? app_email.toJSON() : null;

    const enrichedTemplateData = {
      ...templateData,
      appName: settings.metadata.appName || 'Default App Name',
      supportEmail: settings.metadata.emailSettings.username || 'support@example.com',
      companyName: settings.metadata.companyName || 'Your Company',
      contactNumber: settings.metadata.contactNumber || '123-456-7890',
    };

    const template = emailTemplates[templateName];
    const html = await template(enrichedTemplateData);

    const mailOptions = {
      from: `"${settings.metadata.companyName || 'Your Company'}" <${settings.metadata.emailSettings.username || process.env.EMAIL_USER}>`,
      to,
      subject,
      html: html,
      attachments,
    };

    const transporter = Transporter(settings);

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} with subject "${subject}". Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = sendMail;
