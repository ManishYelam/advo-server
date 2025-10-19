const { DataTypes } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');
const User = require('./User');

const Feedback = sequelize.MAIN_DB_NAME.define(
  'Feedback',
  {
    feedback_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    category: {
      type: DataTypes.ENUM('general', 'bug', 'feature', 'ui', 'performance'),
      allowNull: false,
      defaultValue: 'general',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 2000], // Minimum 10 characters, maximum 2000
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'closed'),
      defaultValue: 'pending',
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
    page_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'page_url',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'tbl_feedbacks',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

module.exports = Feedback;
