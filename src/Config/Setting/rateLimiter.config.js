const rateLimit = require('express-rate-limit');

// Function to create a rate limiter with dynamic configuration
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // Default: 15 minutes
    max = 100, // Default: limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later',
    onLimitReached, // Optional: function to call when the rate limit is exceeded
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    handler: (req, res, next, options) => {
      console.log(`Rate limit exceeded for IP: ${req.ip}`);
      if (onLimitReached) {
        onLimitReached(req, res, next, options);
      } else {
        res.status(options.statusCode).json({ message: options.message });
      }
    },
  });
};

// Example of how to use different rate limits for different routes
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

const authRouteRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // Shorter window for auth routes
  max: 50,
  message: 'Too many login attempts, please try again later',
});

// IP whitelisting example
const whitelist = ['123.456.789.0']; // Example IPs

const rateLimiterWithWhitelist = (req, res, next) => {
  if (whitelist.includes(req.ip)) {
    return next(); // Skip rate limiting for whitelisted IPs
  }
  generalRateLimiter(req, res, next);
};

// Export the rate limiters
module.exports = {
  generalRateLimiter,
  authRouteRateLimiter,
  rateLimiterWithWhitelist,
};
