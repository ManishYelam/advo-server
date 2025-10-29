const cors = require('cors');

const SERVER_URL = process.env.SERVER_URL;  

const corsOptions = {
  origin: [`${SERVER_URL}`, 'https://your-production-url.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

module.exports = cors(corsOptions);
