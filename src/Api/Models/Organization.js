const { DataTypes } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');

const OrganizationAttribute = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  industryType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  numEmployees: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  taxId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  foundedDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  founderName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  socialLinks: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  termsAndConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  privacyPolicy: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emailSettings: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
};
const Organization = sequelize.MAIN_DB_NAME.define('Organization', OrganizationAttribute, {
  tableName: 'tbl_organization',
  timestamps: true,
});

module.exports = Organization;
