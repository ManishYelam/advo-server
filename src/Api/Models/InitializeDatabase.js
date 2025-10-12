const { sequelize } = require('../../Config/Database/db.config');
const { User, ApplicationProperties, ListOfValues, Organization, Cases, Contact, Payment } = require('./Association');

module.exports = {
  InitializeDatabase: async () => {
    try {
      // await sequelize.MAIN_DB_NAME.sync({ alter: false });

      await Promise.all([
        User.sync({ alter: false }),
        ApplicationProperties.sync({ alter: false }),
        ListOfValues.sync({ alter: false }),
        Organization.sync({ alter: false }),
        Cases.sync({ alter: false }),
        Contact.sync({ alter: false }),
        Payment.sync({ alter: false }),
      ]);
    } catch (error) {
      console.error('Error syncing database:', error);
    }
  },
};
