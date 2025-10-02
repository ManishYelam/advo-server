const { Op } = require('sequelize');
const ListOfValues = require('../Models/List.Of.values');

module.exports = {
  // Create or Update List of Value using Upsert
  createOrUpdateLOV: async data => {
    const [lov, created] = await ListOfValues.upsert(data);
    return { lov, created };
  },

  // Get all List of Values (Optional: Filter by category)
  getAllLOVs: async (categories, isActive) => {
    const whereClause = {};
    if (categories?.length) {
      whereClause.category = { [Op.in]: categories };
    }
    if (typeof isActive === 'boolean') {
      whereClause.isActive = isActive;
    }
    return await ListOfValues.findAll({
      where: whereClause,
      order: [['category', 'ASC']],
    });
  },

  // Get a List of Value by ID
  getLOVById: async id => {
    return await ListOfValues.findByPk(id);
  },

  // Soft Delete a List of Value (Set isActive to false)
  deleteLOV: async id => {
    const lov = await ListOfValues.findByPk(id);
    if (!lov) return null;

    await lov.update({ isActive: false });
    return lov;
  },
};
