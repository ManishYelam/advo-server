const ApplicationPropertiesService = require('../Services/ApplicationPropertiesService');

module.exports = {
  // Create or Update a property
  createOrUpdateProperty: async (req, res) => {
    try {
      const propertyData = req.body;
      const property = await ApplicationPropertiesService.createOrUpdateProperty(propertyData);
      res.status(200).json({ message: 'Application properties processed successfully.', data: property });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  createOrUpdateBulkProperties: async (req, res) => {
    try {
      const propertiesData = req.body; // Extract the properties data from the request body
      const result = await ApplicationPropertiesService.createOrUpdateBulkProperties(propertiesData);

      res.status(200).json({
        message: 'Application properties processed successfully.',
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error while creating/updating application properties.',
        error: error.message,
      });
    }
  },

  // Get all properties
  getAllProperties: async (req, res) => {
    try {
      const { page, limit, search, searchFields, ...filters } = req.body;
      const properties = await ApplicationPropertiesService.getAllProperties({ page, limit, search, searchFields, ...filters });
      res.status(200).json(properties);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a property by ID
  getPropertyById: async (req, res) => {
    try {
      const { id } = req.params;
      const property = await ApplicationPropertiesService.getPropertyById(id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      res.status(200).json(property);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete a property
  deleteProperty: async (req, res) => {
    try {
      const { id } = req.params;
      const response = await ApplicationPropertiesService.deleteProperty(id);
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};
