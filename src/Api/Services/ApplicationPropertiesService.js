const { Op } = require('sequelize');
const { ApplicationProperties } = require('../Models/Association');

module.exports = {
  createOrUpdateProperty: async propertyData => {
    try {
      const existingProperty = await ApplicationProperties.findOne({
        where: {
          property_name: propertyData.property_name,
          property_value: propertyData.property_value,
        },
      });

      if (existingProperty) {
        const result = await existingProperty.update(propertyData);
        return {
          message: 'Application property updated successfully.',
          result,
        };
      } else {
        const result = await ApplicationProperties.create(propertyData);
        return {
          message: 'Application property created successfully.',
          result,
        };
      }
    } catch (error) {
      throw new Error('Error while creating/updating application property: ' + error.message);
    }
  },

  createOrUpdateBulkProperties: async propertiesData => {
    try {
      const result = [];
      for (const propertyData of propertiesData) {
        const existingProperty = await ApplicationProperties.findOne({
          where: {
            property_name: propertyData.property_name,
            property_value: propertyData.property_value,
          },
        });

        if (existingProperty) {
          const updatedProperty = await existingProperty.update(propertyData);
          result.push({
            message: 'Application property updated successfully.',
            property: updatedProperty,
          });
        } else {
          const createdProperty = await ApplicationProperties.create(propertyData);
          result.push({
            message: 'Application property created successfully.',
            property: createdProperty,
          });
        }
      }

      return result;
    } catch (error) {
      throw new Error('Error while creating/updating application properties: ' + error.message);
    }
  },

  getAllProperties: async ({ page = 1, limit = 10, search = '', searchFields = [], filters = {} }) => {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = {};

      // **Apply Filters Dynamically**
      if (filters.status) whereConditions.status = filters.status;
      if (filters.property_name) whereConditions.property_name = { [Op.like]: `%${filters.property_name}%` };
      if (filters.property_value) whereConditions.property_value = { [Op.like]: `%${filters.property_value}%` };
      if (filters.user_id) whereConditions.user_id = filters.user_id;

      // **Apply Dynamic Search Using `.map()`**
      let searchConditions =
        search && searchFields.length > 0 ? searchFields.map(field => ({ [field]: { [Op.like]: `%${search}%` } })) : [];

      // **Final WHERE condition combining filters & search**
      let finalWhereCondition = { ...whereConditions };
      if (searchConditions.length > 0) {
        finalWhereCondition[Op.or] = searchConditions;
      }

      // **Fetch Application Properties with Filters, Pagination & Sorting**
      const { rows, count } = await ApplicationProperties.findAndCountAll({
        where: finalWhereCondition,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        message: '✅ Application properties fetched successfully.',
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows,
      };
    } catch (error) {
      throw new Error(`❌ Error in getAllApplicationProperties: ${error.message}`);
    }
  },

  getPropertyById: async id => {
    try {
      return await ApplicationProperties.findOne({
        where: { id },
      });
    } catch (error) {
      throw new Error('Error while fetching the application property: ' + error.message);
    }
  },

  deleteProperty: async id => {
    try {
      const property = await ApplicationProperties.findOne({ where: { id } });
      if (property) {
        await property.destroy();
        return { message: 'Property deleted successfully' };
      }
      throw new Error('Property not found');
    } catch (error) {
      throw new Error('Error while deleting the application property: ' + error.message);
    }
  },
};
