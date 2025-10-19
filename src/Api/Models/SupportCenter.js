const { DataTypes } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');
const User = require('./User');
const Cases = require('./Cases');

module.exports = {
  // SupportTicket Model
  SupportTicket: sequelize.MAIN_DB_NAME.define('support_tickets', {
    support_ticket_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    ticket_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('general', 'technical', 'billing', 'feature', 'bug', 'case_related'),
      allowNull: false,
      defaultValue: 'general'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'open'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    case_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Cases,
        key: 'id'
      }
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id'
      }
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tbl_support_tickets',
    timestamps: true,
    underscored: true
  }),

  // TicketMessage Model
  TicketMessage: sequelize.MAIN_DB_NAME.define('ticket_messages', {
    ticket_message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: this.SupportTicket,
        key: 'support_ticket_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_internal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_by: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tbl_ticket_messages',
    timestamps: true,
    underscored: true
  }),

  // TicketAttachment Model
  TicketAttachment: sequelize.MAIN_DB_NAME.define('ticket_attachments', {
    ticket_attachment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      allowNull: false
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tbl_ticket_attachments',
    timestamps: true,
    underscored: true
  }),

  // FAQ Model
  FAQ: sequelize.MAIN_DB_NAME.define('faqs', {
    faq_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('general', 'technical', 'billing', 'account', 'case_management'),
      allowNull: false,
      defaultValue: 'general'
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tbl_faqs',
    timestamps: true,
    underscored: true
  }),

};