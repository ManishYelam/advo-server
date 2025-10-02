const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX } = require('./constants');

// Rate limiter middleware
const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW, // 15 minutes
  max: RATE_LIMIT_MAX, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

module.exports = apiRateLimiter;

const rateLimit = require('express-rate-limit');

module.exports = {
  // Rate limiter middleware for API requests
  apiRateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
    },
  }),
};
