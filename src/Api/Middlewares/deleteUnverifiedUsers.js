const { Op } = require('sequelize');
const User = require('../Models/User');

const deleteUnverifiedUsers = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const result = await User.destroy({
      where: {
        isVerified: false,
        createdAt: { [Op.lt]: oneHourAgo },
      },
    });
    console.log(`Deleted ${result} unverified user(s) created more than 60 minutes ago. ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('Error deleting unverified users:', error.message);
  }
};

module.exports = deleteUnverifiedUsers;
