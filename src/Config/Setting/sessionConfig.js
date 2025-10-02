const session = require('express-session');

const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Use secure: true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
});

module.exports = sessionConfig;
