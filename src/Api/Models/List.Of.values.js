const { DataTypes } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');

const ListOfValues = sequelize.MAIN_DB_NAME.define(
  'ListOfValues',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'tbl_list_of_values',
    timestamps: true,
  }
);

module.exports = ListOfValues;
