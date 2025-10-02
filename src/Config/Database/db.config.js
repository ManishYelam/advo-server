const connectionPools = require('./mysql.config');
const sequelize = require('./sequelize.config');

const pool = connectionPools;

const TestMySQLConnection = async () => {
  try {
    for (const [dbName, pool] of Object.entries(connectionPools)) {
      const connection = await pool.getConnection();
      console.log(`✅ Connected to MySQL database (${dbName}) successfully.`);
      connection.release();
    }
  } catch (error) {
    console.error(`❌ Error connecting to MySQL database: ${error.message}`, {
      stack: error.stack,
    });
  }
};

const TestSequelizeConnection = async () => {
  try {
    for (const key in sequelize) {
      await sequelize[key].authenticate();
      console.log(`✅ Sequelize connection established successfully for database: ${key}`);
    }
  } catch (error) {
    console.error(`❌ Unable to connect to Sequelize database: ${error.message}`, {
      stack: error.stack,
    });
  }
};

module.exports = {
  pool,
  sequelize,
  TestMySQLConnection,
  TestSequelizeConnection,
};
