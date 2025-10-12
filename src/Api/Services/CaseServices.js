const { Op } = require('sequelize');
const Cases = require('../Models/Cases');

const CaseService = {
  // Create a new case
  createCase: async data => {
    try {
      const newCase = await Cases.create(data);
      return newCase;
    } catch (error) {
      throw new Error('Error creating case: ' + error.message);
    }
  },

  // Get all cases for a client (pagination can be added)
  getAllCases: async ({ page = 1, limit = 10, search = '', searchFields = [], filters = {} }) => {
    try {
      // Pagination offset and limit
      const offset = (page - 1) * limit;

      // Initialize where conditions (for filters)
      let whereConditions = {};

      // **Apply Filters Dynamically**
      if (filters.status) whereConditions.status = filters.status;
      if (filters.case_type) whereConditions.case_type = filters.case_type;
      if (filters.client_name) whereConditions.client_name = { [Op.like]: `%${filters.client_name}%` };
      if (filters.opposing_party) whereConditions.opposing_party = { [Op.like]: `%${filters.opposing_party}%` };
      if (filters.court_name) whereConditions.court_name = { [Op.like]: `%${filters.court_name}%` };
      if (filters.priority) whereConditions.priority = filters.priority;
      if (filters.legal_category) whereConditions.legal_category = filters.legal_category;
      if (filters.payment_status) whereConditions.payment_status = filters.payment_status;
      if (filters.case_outcome) whereConditions.case_outcome = filters.case_outcome;
      if (filters.client_id) whereConditions.client_id = filters.client_id; // Client ID filter

      // **Apply Dynamic Search Using `.map()`**
      let searchConditions =
        search && searchFields.length > 0 ? searchFields.map(field => ({ [field]: { [Op.like]: `%${search}%` } })) : [];

      // **Combine Filters and Search**
      let finalWhereCondition = { ...whereConditions };
      if (searchConditions.length > 0) {
        finalWhereCondition[Op.or] = searchConditions;
      }

      // **Fetch Cases with Filters, Pagination, and Sorting**
      const { rows, count } = await Cases.findAndCountAll({
        where: finalWhereCondition, // Conditions based on filters and search
        limit, // Pagination limit
        offset, // Pagination offset
        order: [['createdAt', 'DESC']], // Sorting by created_at column (descending)
      });

      return {
        message: '✅ Cases fetched successfully.',
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows,
      };
    } catch (error) {
      console.error('❌ Error in getAllCases:', error.message);
      throw new Error(`❌ Error in getAllCases: ${error.message}`);
    }
  },

  // Get a single case by ID
  getCaseById: async id => {
    try {
      const caseData = await Cases.findOne({
        where: { id },
      });
      if (!caseData) throw new Error('Case not found');
      return caseData;
    } catch (error) {
      throw new Error('Error fetching case: ' + error.message);
    }
  },

  // Update case details
  updateCase: async (id, data) => {
    try {
      const updatedCase = await Cases.update(data, {
        where: { id },
        returning: true, // Return updated data
      });
      return updatedCase[1][0]; // Return the updated case
    } catch (error) {
      throw new Error('Error updating case: ' + error.message);
    }
  },

  // Delete a case
  deleteCase: async id => {
    try {
      const deleted = await Cases.destroy({
        where: { id },
      });
      if (!deleted) throw new Error('Case not found');
      return deleted;
    } catch (error) {
      throw new Error('Error deleting case: ' + error.message);
    }
  },
};

module.exports = CaseService;
