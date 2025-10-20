// models/SupportCenter.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');

// Ticket number generator function
const generateTicketNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

// SupportTicket Model
const SupportTicket = sequelize.MAIN_DB_NAME.define(
  'support_tickets',
  {
    support_ticket_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Use string reference to avoid circular dependency
        key: 'id',
      },
    },
    ticket_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: generateTicketNumber // Add defaultValue here
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('general', 'technical', 'billing', 'feature', 'bug', 'case_related'),
      allowNull: false,
      defaultValue: 'general',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    case_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cases', // Use string reference
        key: 'id',
      },
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', // Use string reference
        key: 'id',
      },
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'tbl_support_tickets',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeValidate: (ticket) => {
        console.log('=== BEFORE VALIDATE HOOK FIRED ===');
        if (!ticket.ticket_number) {
          ticket.ticket_number = generateTicketNumber();
          console.log('Generated ticket number in beforeValidate:', ticket.ticket_number);
        }
      },
      beforeCreate: (ticket) => {
        console.log('=== BEFORE CREATE HOOK FIRED ===');
        if (!ticket.ticket_number) {
          ticket.ticket_number = generateTicketNumber();
          console.log('Generated ticket number in beforeCreate:', ticket.ticket_number);
        }
      }
    }
  }
);

// TicketMessage Model - Fix circular reference
const TicketMessage = sequelize.MAIN_DB_NAME.define(
  'ticket_messages',
  {
    ticket_message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // Remove references here, will be handled in associations
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Use string reference
        key: 'id',
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_internal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    read_by: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'tbl_ticket_messages',
    timestamps: true,
    underscored: true,
  }
);

// TicketAttachment Model
const TicketAttachment = sequelize.MAIN_DB_NAME.define(
  'ticket_attachments',
  {
    ticket_attachment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    message_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Use string reference
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'tbl_ticket_attachments',
    timestamps: true,
    underscored: true,
  }
);

// FAQ Model
const FAQ = sequelize.MAIN_DB_NAME.define(
  'faqs',
  {
    faq_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('general', 'technical', 'billing', 'account', 'case_management'),
      allowNull: false,
      defaultValue: 'general',
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Use string reference
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'tbl_faqs',
    timestamps: true,
    underscored: true,
  }
);

module.exports = {
  SupportTicket,
  TicketMessage,
  TicketAttachment,
  FAQ,
};