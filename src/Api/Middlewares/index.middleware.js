const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const securityConfig = require('../../Config/Setting/security.config.js');
const deleteUnverifiedUsers = require('./deleteUnverifiedUsers.js');
const sessionConfig = require('../../Config/Setting/sessionConfig.js');

const app = express();

module.exports = () => {
  app
    .use(express.json({ limit: '50mb' }))
    .use(cors())
    .use(helmet())
    .use(express.urlencoded({ extended: true }))
    .use(cookieParser())
    .use(sessionConfig)
    .use(securityConfig);

  // cron.schedule('0 * * * *', () => {
  //   (async () => {
  //     await deleteUnverifiedUsers();
  //   })();
  // });

  return app;
};
