const { DataTypes } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');

const Contact = sequelize.MAIN_DB_NAME.define(
  'Contact',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM('Pending', 'Reviewed', 'Resolved'),
      allowNull: false,
      defaultValue: 'Pending',
    },

    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High'),
      allowNull: false,
      defaultValue: 'Medium',
    },

    admin_remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    responded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    handled_by_admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'tbl_contacts',
    timestamps: true,
  }
);

module.exports = Contact;
