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
    caseNumber: {           
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {                
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {          
      type: DataTypes.TEXT,
      allowNull: true,
    },
    caseType: {             
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {               
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Running",
    },
    courtName: {            
      type: DataTypes.STRING,
      allowNull: true,
    },
    nextHearingDate: {      
      type: DataTypes.DATE,
      allowNull: true,
    },
    filingDate: {           
      type: DataTypes.DATE,
      allowNull: false,
    },
    clientName: {           
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientContact: {        
      type: DataTypes.STRING,
      allowNull: true,
    },
    clientAddress: {        
      type: DataTypes.STRING,
      allowNull: true,
    },
    priority: {             
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Normal",
    },
    fees: {                 
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    paymentStatus: {        
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "Pending",
    },
    documents: {            
      type: DataTypes.JSON,
      allowNull: true,
    },
    notes: {                
      type: DataTypes.TEXT,
      allowNull: true,
    },
    opposingParty: {        
      type: DataTypes.STRING,
      allowNull: true,
    },
    caseOutcome: {          
      type: DataTypes.STRING,
      allowNull: true,
    },
    reminders: {            
      type: DataTypes.JSON,
      allowNull: true,
    },
    legalCategory: {        
      type: DataTypes.STRING,
      allowNull: true,
    },
    courtAddress: {         
      type: DataTypes.STRING,
      allowNull: true,
    },
    documentsSharedWithClient: { 
      type: DataTypes.JSON,
      allowNull: true,
    },
    clientId: {              
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: 'tbl_cases',
    timestamps: true,
  }
);

module.exports = Cases;
