const User = require('./User');
const Organization = require('./Organization');
const ApplicationProperties = require('./Application.Prop');
const ListOfValues = require('./List.Of.values');
const Cases = require('./Cases');
const Contact = require('./Contacts');
const Payment = require('./Payment');
const UserDocument = require('./UserDocument');
const { SupportTicket, TicketMessage, TicketAttachment, FAQ } = require('./SupportCenter');
const Feedback = require('./Feedback');

// One client can have many cases
User.hasMany(Cases, { foreignKey: 'client_id', as: 'cases' });
Cases.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

// Optionally, if you want an advocate to be assigned (for multi-advocate scenario)
User.hasMany(Cases, { foreignKey: 'advocate_id', as: 'assignedCases' });
Cases.belongsTo(User, { foreignKey: 'advocate_id', as: 'advocate' });

Cases.hasMany(Payment, { foreignKey: 'case_id', as: 'payments' });
Payment.belongsTo(Cases, { foreignKey: 'client_id', as: 'case' });

// User has many Documents
User.hasMany(UserDocument, {
  foreignKey: 'user_id',
  as: 'userDocuments', // Changed from 'documents'
});

UserDocument.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// Case has many Documents
Cases.hasMany(UserDocument, {
  foreignKey: 'case_id',
  as: 'caseDocuments', // Changed from 'documents'
});

UserDocument.belongsTo(Cases, {
  foreignKey: 'case_id',
  as: 'case',
});

// SupportTicket Associations
SupportTicket.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

SupportTicket.belongsTo(User, {
  foreignKey: 'assigned_to',
  as: 'assigned_agent',
});

SupportTicket.belongsTo(Cases, {
  foreignKey: 'case_id',
  as: 'related_case',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

SupportTicket.hasMany(TicketMessage, {
  foreignKey: 'ticket_id',
  as: 'messages',
});

SupportTicket.hasMany(TicketAttachment, {
  foreignKey: 'ticket_id',
  as: 'ticket_attachments',
});

// TicketMessage Associations
TicketMessage.belongsTo(SupportTicket, {
  foreignKey: 'ticket_id',
  as: 'ticket',
});

TicketMessage.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

TicketMessage.hasMany(TicketAttachment, {
  foreignKey: 'message_id',
  as: 'attachments',
});

// TicketAttachment Associations
TicketAttachment.belongsTo(SupportTicket, {
  foreignKey: 'ticket_id',
  as: 'ticket',
});

TicketAttachment.belongsTo(TicketMessage, {
  foreignKey: 'message_id',
  as: 'message',
});

TicketAttachment.belongsTo(User, {
  foreignKey: 'uploaded_by',
  as: 'uploader',
});

// FAQ Associations
FAQ.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'author',
});

// Reverse Associations from existing models
User.hasMany(SupportTicket, {
  foreignKey: 'user_id',
  as: 'support_tickets',
});

User.hasMany(SupportTicket, {
  foreignKey: 'assigned_to',
  as: 'assigned_support_tickets',
});

User.hasMany(TicketMessage, {
  foreignKey: 'user_id',
  as: 'ticket_messages',
});

User.hasMany(TicketAttachment, {
  foreignKey: 'uploaded_by',
  as: 'uploaded_attachments',
});

User.hasMany(FAQ, {
  foreignKey: 'created_by',
  as: 'created_faqs',
});

Cases.hasMany(SupportTicket, {
  foreignKey: 'case_id',
  as: 'support_tickets',
});

// Generate unique ticket number
// In your SupportTicket model definition, ensure the hook is properly set
// SupportTicket.beforeCreate(async (ticket) => {
//   try {
//     const timestamp = Date.now().toString().slice(-6);
//     const random = Math.random().toString(36).substring(2, 5).toUpperCase();
//     ticket.ticket_number = `TKT-${timestamp}-${random}`;

//     // Ensure it's set
//     console.log('Generated ticket number:', ticket.ticket_number);
//   } catch (error) {
//     console.error('Error generating ticket number:', error);
//     // Fallback generation
//     const timestamp = Date.now();
//     const random = Math.floor(Math.random() * 1000);
//     ticket.ticket_number = `TKT-${timestamp}-${random}`;
//   }
// });
Feedback.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = {
  User,
  Organization,
  ApplicationProperties,
  ListOfValues,
  Cases,
  Contact,
  Payment,
  UserDocument,

  // Support models
  SupportTicket,
  TicketMessage,
  TicketAttachment,
  FAQ,

  Feedback,
};
