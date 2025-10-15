const { DataTypes } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');
const User = require('./User');

const Payment = sequelize.MAIN_DB_NAME.define(
  'Payment',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    order_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Razorpay order ID',
    },
    payment_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Razorpay payment ID',
    },
    signature: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Razorpay signature for verification',
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Amount in paise',
    },
    amount_due: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Amount due in paise',
    },
    amount_paid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Amount paid in paise',
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of payment attempts',
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'INR',
      comment: 'Payment currency',
    },
    entity: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('created', 'paid', 'failed'),
      defaultValue: 'created',
      comment: 'Payment status',
    },
    method: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Payment method (UPI, Card, NetBanking, etc.)',
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Customer email',
    },
    contact: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Customer contact number',
    },
    offer_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Offer or coupon ID if applicable',
    },
    receipt: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Receipt number for reference',
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Extra payment metadata',
    },
  },
  {
    tableName: 'tbl_payments',
    timestamps: true,
    comment: 'Stores all Razorpay payment transactions',
  }
);

module.exports = Payment;
