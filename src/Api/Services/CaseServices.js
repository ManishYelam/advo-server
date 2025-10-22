const { Op } = require('sequelize');
const Cases = require('../Models/Cases');
const Payment = require('../Models/Payment');

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
      const offset = (page - 1) * limit;

      const whereConditions = {};
      if (filters.status) whereConditions.status = filters.status;
      if (filters.deposit_type) whereConditions.deposit_type = filters.deposit_type;
      if (filters.verified) whereConditions.verified = filters.verified === 'true' || filters.verified === true;
      if (filters.client_id) whereConditions.client_id = filters.client_id;
      if (filters.deposit_duration_years) whereConditions.deposit_duration_years = filters.deposit_duration_years;

      let searchConditions = [];
      if (search && searchFields.length) {
        searchConditions = searchFields.map(field => ({
          [field]: { [Op.like]: `%${search}%` },
        }));
      }

      const finalWhere = { ...whereConditions };
      if (searchConditions.length) finalWhere[Op.or] = searchConditions;

      const { rows, count } = await Cases.findAndCountAll({
        where: finalWhere,
        offset,
        limit: parseInt(limit),
        order: [['createdAt', 'DESC']],
        attributes: [
          'id',
          'client_id',
          'status',
          'saving_account_start_date',
          'deposit_type',
          'deposit_duration_years',
          'fixed_deposit_total_amount',
          'interest_rate_fd',
          'saving_account_total_amount',
          'interest_rate_saving',
          'recurring_deposit_total_amount',
          'interest_rate_recurring',
          'dnyanrudha_investment_total_amount',
          'dynadhara_rate',
          'verified',
          'documents',
          'createdAt',
          'updatedAt',
        ],
        include: [
          {
            model: Payment,
            as: 'payments',
            attributes: [
              'id',
              'amount',
              'currency',
              'status',
              'method',
              'receipt',
              'payment_id',
              'order_id',
              'amount_due',
              'client_id',
              'case_id',
              'notes',
              'createdAt',
              'updatedAt',
            ],
          },
        ],
      });

      return {
        message: '✅ Cases fetched successfully.',
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        data: rows,
      };
    } catch (error) {
      console.error('❌ Error in caseService.getAllCases:', error.message);
      throw new Error(error.message);
    }
  },

  // Get a single case by ID
  getCaseById: async (id) => {
    try {
      const caseData = await Cases.findOne({
        where: { id },
        attributes: [],
        include: [
          {
            model: Payment,
            as: 'payments',
            attributes: [],
          },
        ],
      });
      if (!caseData) {
        return {
          success: false,
          message: '❌ Case not found.',
        };
      }
      return {
        success: true,
        message: '✅ Case fetched successfully.',
        data: caseData,
      };
    } catch (error) {
      console.error('❌ Error in caseService.getCaseById:', error.message);
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
