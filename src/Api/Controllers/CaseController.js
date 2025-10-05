const CaseService = require("../Services/CaseServices");

module.exports = {
    // Controller for creating a new case
    createCase: async (req, res) => {
        try {
            const caseData = req.body;  // Get data from request body
            console.log(req.user_info.id);
            const client_id = req.user_info.id;
            const client_name = req.user_info.full_name;
            caseData.client_id = client_id;
            caseData.client_name = client_name;
            const newCase = await CaseService.createCase(caseData);  // Call service method
            return res.status(201).json({
                message: '✅ Case created successfully.',
                data: newCase,
            });
        } catch (error) {
            console.error('❌ Error in createCase:', error.message);
            return res.status(500).json({
                message: '❌ Error creating case.',
                error: error.message,
            });
        }
    },

    // Controller for getting all cases
      getAllCases: async (req, res) => {
    try {
      const { page, limit, search, searchFields, filters } = req.body;

      // Ensure filters is an object and not a string
      const caseFilters = filters || {}; // If filters are undefined or null, use an empty object

      // Calling the service with pagination, search, and filters
      const cases = await CaseService.getAllCases({
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
        search: search || '',
        searchFields: searchFields ? searchFields.split(',') : [],
        filters: caseFilters,  // Directly pass filters as an object
      });

      return res.status(200).json(cases);
    } catch (error) {
      console.error('❌ Error in getAllCases:', error.message);
      return res.status(500).json({
        message: '❌ Error fetching cases.',
        error: error.message,
      });
    }
  },

    // Controller for getting a single case by ID
    getCaseById: async (req, res) => {
        try {
            const { id } = req.params;
            const caseData = await CaseService.getCaseById(id);  // Get case by ID
            return res.status(200).json({
                message: '✅ Case fetched successfully.',
                data: caseData,
            });
        } catch (error) {
            console.error('❌ Error in getCaseById:', error.message);
            return res.status(500).json({
                message: '❌ Error fetching case.',
                error: error.message,
            });
        }
    },

    // Controller for updating a case by ID
    updateCase: async (req, res) => {
        try {
            const { id } = req.params;
            const caseData = req.body;  // Data to be updated
            const updatedCase = await CaseService.updateCase(id, caseData);  // Call service to update
            return res.status(200).json({
                message: '✅ Case updated successfully.',
                data: updatedCase,
            });
        } catch (error) {
            console.error('❌ Error in updateCase:', error.message);
            return res.status(500).json({
                message: '❌ Error updating case.',
                error: error.message,
            });
        }
    },

    // Controller for deleting a case by ID
    deleteCase: async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await CaseService.deleteCase(id);  // Call service to delete case
            return res.status(200).json({
                message: '✅ Case deleted successfully.',
            });
        } catch (error) {
            console.error('❌ Error in deleteCase:', error.message);
            return res.status(500).json({
                message: '❌ Error deleting case.',
                error: error.message,
            });
        }
    }

}



