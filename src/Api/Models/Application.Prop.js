const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../../Config/Database/db.config');

const ApplicationPropAttribute = {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  property_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  property_value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  desc: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
  },
};

const ApplicationProperties = sequelize.MAIN_DB_NAME.define('ApplicationProperties', ApplicationPropAttribute, {
  tableName: 'tbl_application_properties',
  indexes: [
    {
      unique: true,
      fields: ['property_name', 'property_value'],
    },
  ],
  timestamps: true,
});

// ✅ **Hook to Automatically Set Others to Inactive**
ApplicationProperties.beforeCreate(async (instance, options) => {
  if (instance.property_name === 'app_email' && instance.status === 'active') {
    await ApplicationProperties.update(
      { status: 'inactive' }, // Set others to inactive
      { where: { property_name: 'app_email', status: 'active' } }
    );
  }
});

ApplicationProperties.beforeUpdate(async (instance, options) => {
  if (instance.property_name === 'app_email' && instance.status === 'active') {
    await ApplicationProperties.update(
      { status: 'inactive' }, // Deactivate others
      { where: { property_name: 'app_email', status: 'active', id: { [Op.ne]: instance.id } } }
    );
  }
});

module.exports = ApplicationProperties;
