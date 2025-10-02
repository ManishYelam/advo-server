const listOfValuesService = require('../Services/GenericServices');

module.exports = {
  // Create or Update LOV
  createOrUpdateLOV: async (req, res) => {
    try {
      const { lov, created } = await listOfValuesService.createOrUpdateLOV(req.body);
      const message = created ? 'LOV created successfully' : 'LOV updated successfully';

      res.status(201).json({ success: true, message, data: lov });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error processing LOV', error: error.message });
    }
  },

  // Get all LOVs (Optional: Filter by category)
  getAllLOVs: async (req, res) => {
    try {
      const { categories, isActive } = req.body;
      const lovs = await listOfValuesService.getAllLOVs(categories, isActive);
      res.json({ success: true, data: lovs });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching LOVs', error: error.message });
    }
  },

  // Get LOV by ID
  getLOVById: async (req, res) => {
    try {
      const lov = await listOfValuesService.getLOVById(req.params.id);
      if (!lov) return res.status(404).json({ success: false, message: 'LOV not found' });

      res.json({ success: true, data: lov });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching LOV', error: error.message });
    }
  },

  // Soft Delete LOV
  deleteLOV: async (req, res) => {
    try {
      const deletedLOV = await listOfValuesService.deleteLOV(req.params.id);
      if (!deletedLOV) return res.status(404).json({ success: false, message: 'LOV not found' });

      res.json({ success: true, message: 'LOV deleted (soft delete)', data: deletedLOV });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error deleting LOV', error: error.message });
    }
  },
};
