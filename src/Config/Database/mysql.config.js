require('dotenv').config();
const mysql = require('mysql2/promise');
const { databases } = require('../Database/Data');

const isProduction = process.env.NODE_ENV === 'production';

const DB_HOST = isProduction ? process.env.P_DB_HOST : process.env.L_DB_HOST;
const DB_USER = isProduction ? process.env.P_DB_USER : process.env.L_DB_USER;
const DB_PASSWORD = isProduction ? process.env.P_DB_PASSWORD : process.env.L_DB_PASSWORD;
const DB_PORT = process.env.DB_PORT || 3306;

const baseConfig = {
  port: DB_PORT,
  connectionLimit: 10,
  multipleStatements: true,
};

const createDbConfig = dbName => ({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: process.env[`${dbName}_DB_NAME`],
  ...baseConfig,
});

const sqlConfig = databases.reduce((acc, dbName) => {
  acc[`${dbName}_DB`] = createDbConfig(dbName);
  return acc;
}, {});

const createConnectionPools = () => {
  return Object.entries(sqlConfig).reduce((pools, [dbName, config]) => {
    pools[dbName] = mysql.createPool(config);
    return pools;
  }, {});
};

const connectionPools = createConnectionPools();

module.exports = connectionPools;
