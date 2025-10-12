const { DataTypes } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');
const User = require('./User');

const Cases = sequelize.MAIN_DB_NAME.define(
  'Cases',
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
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    case_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    case_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    case_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending',
    },
    court_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    next_hearing_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    filing_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    client_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client_contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    client_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Normal',
    },
    fees: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Pending',
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    opposing_party: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    case_outcome: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reminders: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    legal_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    court_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    documents_shared_with_client: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
  },
  {
    tableName: 'tbl_cases',
    timestamps: true,
  }
);

module.exports = Cases;
