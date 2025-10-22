const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const moment = require('moment');
const Middleware = require('./src/Api/Middlewares/index.middleware.js');
const routes = require('./src/Api/Routes/index.js');
const { InitializeDatabase } = require('./src/Api/Models/InitializeDatabase');
const { TestSequelizeConnection, TestMySQLConnection } = require('./src/Config/Database/db.config.js');
const authMiddleware = require('./src/Api/Middlewares/authorizationMiddleware.js');
require('dotenv').config();

const app = Middleware();
app.use(cors());
const server = http.createServer(app);

const DefineRoutes = () => {
  // 📌 Serve static files (CSS, Images, JS)
  app.use(express.static(path.join(__dirname, 'public')));

  // 📌 **Serve Intro**
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // 📌 **Serve Uploaded Files**
  app.use('/UPLOAD_DIR', authMiddleware, express.static('UPLOAD_DIR'));

  // 📌 **Serve APIs**
  app.use('/api', routes);
};

const StartServer = async () => {
  try {
    await Promise.all([TestMySQLConnection(), TestSequelizeConnection()]);
    InitializeDatabase();
    DefineRoutes();

    const PORT = process.env.MAIN_SERVER_PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Main server running on port ${PORT} at ${new Date().toLocaleString()}.`);
    });
  } catch (error) {
    throw new Error(`❌ Error during server startup: ${error.message}`);
  }
};

StartServer();
