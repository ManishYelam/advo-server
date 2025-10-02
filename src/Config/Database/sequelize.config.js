require('dotenv').config();
const { Sequelize } = require('sequelize');
const { databases } = require('../Database/Data');

const isProduction = process.env.NODE_ENV === 'production';

const DB_HOST = isProduction ? process.env.P_DB_HOST : process.env.L_DB_HOST;
const DB_USER = isProduction ? process.env.P_DB_USER : process.env.L_DB_USER;
const DB_PASSWORD = isProduction ? process.env.P_DB_PASSWORD : process.env.L_DB_PASSWORD;
const DB_DIALECT = process.env.DB_DIALECT || 'mysql';
const DB_PORT = process.env.DB_PORT || 3306;

const DATABASES = databases.reduce((acc, key) => {
  acc[`${key}_DB_NAME`] = process.env[`${key}_DB_NAME`];
  return acc;
}, {});

const initDatabases = () => {
  const sequelizeInstances = {};
  for (const [key, dbName] of Object.entries(DATABASES)) {
    sequelizeInstances[key] = new Sequelize(dbName, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      dialect: DB_DIALECT,
      port: DB_PORT,
      logging: msg => console.log(msg),
      pool: {
        max: 15,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
    });
  }
  return sequelizeInstances;
};

const sequelize = initDatabases();

module.exports = sequelize;
