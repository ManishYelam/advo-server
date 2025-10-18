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

// const nodemailer = require('nodemailer');
// const emailTemplates = require('../../Api/EmailTemplets/Templates');
// const { ApplicationProperties } = require('../../Api/Models/Association');
// const fs = require('fs').promises;
// const path = require('path');

// // Enhanced Transporter with more options
// const createTransporter = (settings) => {
//   const transportConfig = {
//     host: settings.metadata.emailSettings.host || 'smtp.gmail.com',
//     port: settings.metadata.emailSettings.port || 587,
//     secure: settings.metadata.emailSettings.secure || false,
//     auth: {
//       user: settings.metadata.emailSettings.username,
//       pass: settings.metadata.emailSettings.password,
//     },
//     // Advanced connection options
//     pool: settings.metadata.emailSettings.pool || true,
//     maxConnections: settings.metadata.emailSettings.maxConnections || 5,
//     maxMessages: settings.metadata.emailSettings.maxMessages || 100,
//     rateDelta: settings.metadata.emailSettings.rateDelta || 1000,
//     rateLimit: settings.metadata.emailSettings.rateLimit || 5,
//     // TLS options
//     tls: {
//       rejectUnauthorized: settings.metadata.emailSettings.rejectUnauthorized || false,
//       minVersion: settings.metadata.emailSettings.tlsMinVersion || 'TLSv1.2'
//     },
//     // Debugging
//     debug: settings.metadata.emailSettings.debug || false,
//     logger: settings.metadata.emailSettings.logger || false
//   };

//   return nodemailer.createTransport(transportConfig);
// };

// // Validate email format
// const isValidEmail = (email) => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// // Process attachments - support multiple types
// const processAttachments = async (attachments = []) => {
//   const processedAttachments = [];

//   for (const attachment of attachments) {
//     try {
//       // If attachment is a file path
//       if (attachment.path) {
//         try {
//           const fileBuffer = await fs.readFile(attachment.path);
//           processedAttachments.push({
//             filename: attachment.filename || path.basename(attachment.path),
//             content: fileBuffer,
//             contentType: attachment.contentType || getMimeType(attachment.path),
//             encoding: attachment.encoding || 'base64'
//           });
//         } catch (error) {
//           console.warn(`⚠️ Could not read file: ${attachment.path}`, error.message);
//           continue;
//         }
//       }
//       // If attachment is a buffer
//       else if (attachment.content && Buffer.isBuffer(attachment.content)) {
//         processedAttachments.push({
//           filename: attachment.filename || 'attachment.bin',
//           content: attachment.content,
//           contentType: attachment.contentType || 'application/octet-stream',
//           encoding: attachment.encoding || 'base64'
//         });
//       }
//       // If attachment is a string (treated as text)
//       else if (typeof attachment.content === 'string') {
//         processedAttachments.push({
//           filename: attachment.filename || 'document.txt',
//           content: attachment.content,
//           contentType: attachment.contentType || 'text/plain',
//           encoding: attachment.encoding || 'utf8'
//         });
//       }
//       // If attachment has href (URL)
//       else if (attachment.href) {
//         processedAttachments.push({
//           filename: attachment.filename || 'file.pdf',
//           path: attachment.href,
//           contentType: attachment.contentType
//         });
//       }
//     } catch (error) {
//       console.error(`❌ Error processing attachment:`, error);
//     }
//   }

//   return processedAttachments;
// };

// // Get MIME type from filename
// const getMimeType = (filename) => {
//   const ext = path.extname(filename).toLowerCase();
//   const mimeTypes = {
//     '.pdf': 'application/pdf',
//     '.jpg': 'image/jpeg',
//     '.jpeg': 'image/jpeg',
//     '.png': 'image/png',
//     '.gif': 'image/gif',
//     '.doc': 'application/msword',
//     '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     '.xls': 'application/vnd.ms-excel',
//     '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     '.zip': 'application/zip',
//     '.txt': 'text/plain',
//     '.html': 'text/html',
//     '.csv': 'text/csv'
//   };
//   return mimeTypes[ext] || 'application/octet-stream';
// };

// // Advanced sendMail function with comprehensive options
// const sendMail = async (options = {}) => {
//   const {
//     to,                    // Single email or array of emails
//     subject,               // Email subject
//     templateName,          // Template name for HTML content
//     templateData = {},     // Data for template
//     html,                  // Raw HTML content (overrides template)
//     text,                  // Plain text version
//     attachments = [],      // Array of attachments
//     cc = [],               // CC recipients
//     bcc = [],              // BCC recipients
//     replyTo,               // Reply-to address
//     priority = 'normal',   // high, normal, low
//     headers = {},          // Custom headers
//     encoding = 'utf-8',    // Message encoding
//     date = new Date(),     // Send date
//     messageId,             // Custom message ID
//     inReplyTo,             // In-Reply-To header
//     references = [],       // References header
//     watchHtml,             // HTML for Apple Watch
//     amp,                   // AMP4EMAIL content
//     icalEvent,             // iCalendar event
//     disableFileAccess = false, // Disable file access
//     disableUrlAccess = false,  // Disable URL access
//     list = {}              // List-* headers
//   } = options;

//   try {
//     // Validate required parameters
//     if (!to || !subject) {
//       throw new Error('"to" and "subject" are required parameters');
//     }

//     // Get email settings
//     const app_email = await ApplicationProperties.findOne({
//       where: { property_name: 'app_email', status: 'active' },
//     });

//     if (!app_email) {
//       throw new Error('Email configuration not found');
//     }

//     const settings = app_email.toJSON();

//     // Validate email credentials
//     if (!settings.metadata.emailSettings?.username || !settings.metadata.emailSettings?.password) {
//       throw new Error('Email credentials not configured');
//     }

//     // Process recipients
//     const processRecipients = (recipients) => {
//       if (!recipients) return undefined;
//       if (Array.isArray(recipients)) {
//         return recipients.filter(email => isValidEmail(email)).join(', ');
//       }
//       return isValidEmail(recipients) ? recipients : undefined;
//     };

//     const toEmails = processRecipients(to);
//     const ccEmails = processRecipients(cc);
//     const bccEmails = processRecipients(bcc);

//     if (!toEmails) {
//       throw new Error('No valid "to" email addresses provided');
//     }

//     // Prepare template data
//     const enrichedTemplateData = {
//       ...templateData,
//       appName: settings.metadata.appName || 'Default App Name',
//       supportEmail: settings.metadata.emailSettings.username,
//       companyName: settings.metadata.companyName || 'Your Company',
//       contactNumber: settings.metadata.contactNumber || '123-456-7890',
//       currentYear: new Date().getFullYear(),
//     };

//     // Generate HTML content
//     let finalHtml = html;
//     if (!finalHtml && templateName) {
//       const template = emailTemplates[templateName];
//       if (!template) {
//         throw new Error(`Email template "${templateName}" not found`);
//       }
//       finalHtml = await template(enrichedTemplateData);
//     }

//     // Process attachments
//     const processedAttachments = await processAttachments(attachments);

//     // Prepare priority mapping
//     const priorityMap = {
//       high: '1',
//       normal: '3',
//       low: '5'
//     };

//     // Build comprehensive mail options
//     const mailOptions = {
//       // Basic options
//       from: `"${settings.metadata.companyName || 'Your Company'}" <${settings.metadata.emailSettings.username}>`,
//       to: toEmails,
//       subject: subject,
      
//       // Content
//       html: finalHtml,
//       text: text || (finalHtml ? finalHtml.replace(/<[^>]*>/g, '') : ''), // Auto-generate text from HTML if not provided
      
//       // Recipients
//       cc: ccEmails,
//       bcc: bccEmails,
//       replyTo: replyTo || settings.metadata.emailSettings.username,
      
//       // Attachments
//       attachments: processedAttachments,
      
//       // Headers
//       headers: {
//         'X-Priority': priorityMap[priority] || '3',
//         'X-Mailer': 'NodeMailer',
//         'X-Auto-Response-Suppress': 'All',
//         'Precedence': 'bulk',
//         ...headers
//       },
      
//       // Advanced options
//       encoding: encoding,
//       date: date,
//       messageId: messageId,
//       inReplyTo: inReplyTo,
//       references: references.length > 0 ? references.join(' ') : undefined,
//       watchHtml: watchHtml,
//       amp: amp,
//       icalEvent: icalEvent,
//       disableFileAccess: disableFileAccess,
//       disableUrlAccess: disableUrlAccess,
//       list: list
//     };

//     // Remove undefined values
//     Object.keys(mailOptions).forEach(key => {
//       if (mailOptions[key] === undefined) {
//         delete mailOptions[key];
//       }
//     });

//     // Create transporter and send email
//     const transporter = createTransporter(settings);

//     // Verify connection configuration
//     await transporter.verify();
//     console.log('✅ SMTP connection verified');

//     // Send email
//     const info = await transporter.sendMail(mailOptions);

//     // Log success with details
//     console.log(`✅ Email sent successfully`);
//     console.log(`   To: ${toEmails}`);
//     console.log(`   Subject: "${subject}"`);
//     console.log(`   Message ID: ${info.messageId}`);
//     console.log(`   Attachments: ${processedAttachments.length}`);
//     if (ccEmails) console.log(`   CC: ${ccEmails}`);
//     if (bccEmails) console.log(`   BCC: ${bccEmails}`);

//     return {
//       success: true,
//       messageId: info.messageId,
//       response: info.response,
//       envelope: info.envelope,
//       accepted: info.accepted,
//       rejected: info.rejected,
//       pending: info.pending,
//       message: 'Email sent successfully'
//     };

//   } catch (error) {
//     console.error('❌ Error sending email:', error);
    
//     return {
//       success: false,
//       message: error.message,
//       error: error.stack,
//       code: error.code
//     };
//   }
// };

// // Convenience functions for common use cases
// sendMail.sendTemplate = async (to, subject, templateName, templateData, options = {}) => {
//   return sendMail({
//     to,
//     subject,
//     templateName,
//     templateData,
//     ...options
//   });
// };

// sendMail.sendHtml = async (to, subject, html, text, options = {}) => {
//   return sendMail({
//     to,
//     subject,
//     html,
//     text,
//     ...options
//   });
// };

// sendMail.sendText = async (to, subject, text, options = {}) => {
//   return sendMail({
//     to,
//     subject,
//     text,
//     ...options
//   });
// };

// // Test email configuration
// sendMail.testConfiguration = async () => {
//   try {
//     const app_email = await ApplicationProperties.findOne({
//       where: { property_name: 'app_email', status: 'active' },
//     });

//     if (!app_email) {
//       return { success: false, message: 'Email configuration not found' };
//     }

//     const settings = app_email.toJSON();
//     const transporter = createTransporter(settings);
    
//     await transporter.verify();
//     return { success: true, message: 'Email configuration is valid' };
//   } catch (error) {
//     return { success: false, message: error.message };
//   }
// };

// module.exports = sendMail;