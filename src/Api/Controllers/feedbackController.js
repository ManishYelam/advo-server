const feedbackService = require("../Services/feedbackService");

module.exports = {
  // Submit new feedback
  submitFeedback: async (req, res) => {
    try {     
      const { rating, category, message } = req.body;
      const userId = req.user_info.id;

      const feedbackData = {
        user_id: userId,
        rating,
        category,
        message,
        user_agent: req.get('User-Agent'),
        page_url: req.get('Referer'),
        metadata: {
          ipAddress: req.ip,
          browser: req.get('User-Agent'),
        },
      };

      const result = await feedbackService.createFeedback(feedbackData);

      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      console.error('Submit feedback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get all feedback (admin only)
  getAllFeedback: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        status, 
        userId, 
        sortBy = 'createdAt', 
        sortOrder = 'DESC' 
      } = req.query;

      const result = await feedbackService.getAllFeedback({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        status,
        userId,
        sortBy,
        sortOrder,
      });

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Get all feedback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get feedback by ID
  getFeedbackById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await feedbackService.getFeedbackById(parseInt(id));
      
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.error('Get feedback by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Update feedback status (admin only)
  updateFeedbackStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const result = await feedbackService.updateFeedbackStatus(
        parseInt(id), 
        status, 
        adminNotes
      );

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.error('Update feedback status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get feedback statistics (admin only)
  getFeedbackStats: async (req, res) => {
    try {
      const result = await feedbackService.getFeedbackStats();
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Get feedback stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Get user's own feedback
  getUserFeedback: async (req, res) => {
    try {
      const userId = req.user_info.id;
      const { page = 1, limit = 10 } = req.query;

      const result = await feedbackService.getUserFeedback(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Get user feedback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },

  // Delete feedback (admin only)
  deleteFeedback: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await feedbackService.deleteFeedback(parseInt(id));
      
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      console.error('Delete feedback error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  },
};