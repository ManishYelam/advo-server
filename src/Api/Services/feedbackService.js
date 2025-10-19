const { Sequelize } = require('sequelize');
const { Feedback, User } = require('../Models/Association');

module.exports = {
  // Create new feedback
  createFeedback: async feedbackData => {
    try {
      const feedback = await Feedback.create(feedbackData);
      return {
        success: true,
        data: feedback,
        message: 'Feedback submitted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to create feedback: ${error.message}`);
    }
  },

  // Get all feedback with pagination and filters
  getAllFeedback: async (options = {}) => {
    try {
      const { page = 1, limit = 10, category, status, userId, sortBy = 'createdAt', sortOrder = 'DESC' } = options;

      const where = {};
      if (category) where.category = category;
      if (status) where.status = status;
      if (userId) where.user_id = userId;

      const offset = (page - 1) * limit;

      const { count, rows } = await Feedback.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'role'],
          },
        ],
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: offset,
      });

      return {
        success: true,
        data: {
          feedbacks: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }
  },

  // Get feedback by ID
  getFeedbackById: async id => {
    try {
      const feedback = await Feedback.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'role'],
          },
        ],
      });

      if (!feedback) {
        return {
          success: false,
          message: 'Feedback not found',
        };
      }

      return {
        success: true,
        data: feedback,
      };
    } catch (error) {
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }
  },

  // Update feedback status
  updateFeedbackStatus: async (id, status, adminNotes = null) => {
    try {
      const feedback = await Feedback.findByPk(id);

      if (!feedback) {
        return {
          success: false,
          message: 'Feedback not found',
        };
      }

      const updatedFeedback = await feedback.update({
        status,
        ...(adminNotes && { metadata: { ...feedback.metadata, adminNotes } }),
      });

      return {
        success: true,
        data: updatedFeedback,
        message: 'Feedback status updated successfully',
      };
    } catch (error) {
      throw new Error(`Failed to update feedback: ${error.message}`);
    }
  },

  // Get feedback statistics
  getFeedbackStats: async () => {
    try {
      const stats = await Feedback.findAll({
        attributes: [
          'category',
          [Sequelize.fn('COUNT', Sequelize.col('feedback_id')), 'count'],
          [Sequelize.fn('AVG', Sequelize.col('rating')), 'average_rating'],
        ],
        group: ['category'],
      });

      const statusStats = await Feedback.findAll({
        attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('feedback_id')), 'count']],
        group: ['status'],
      });

      const totalCount = await Feedback.count();
      const averageRating = await Feedback.findOne({
        attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'overall_average']],
      });

      return {
        success: true,
        data: {
          byCategory: stats,
          byStatus: statusStats,
          totalCount,
          overallAverage: averageRating?.dataValues?.overall_average || 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch feedback statistics: ${error.message}`);
    }
  },

  // Get user's feedback history
  getUserFeedback: async (userId, options = {}) => {
    try {
      const { page = 1, limit = 10 } = options;

      const offset = (page - 1) * limit;

      const { count, rows } = await Feedback.findAndCountAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset,
      });

      return {
        success: true,
        data: {
          feedbacks: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch user feedback: ${error.message}`);
    }
  },

  // Delete feedback (admin only)
  deleteFeedback: async id => {
    try {
      const feedback = await Feedback.findByPk(id);

      if (!feedback) {
        return {
          success: false,
          message: 'Feedback not found',
        };
      }

      await feedback.destroy();

      return {
        success: true,
        message: 'Feedback deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete feedback: ${error.message}`);
    }
  },
};
