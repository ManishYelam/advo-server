require('dotenv').config();

const JWT_CONFIG = {
  SECRET:
    process.env.JWT_SECRET ||
    '2277c863a356e796a1bd600d1f3d219ef0632bf1635f431886796298558be460055faa328045100fbd0a8b4551c938595409',
  EXPIRATION: process.env.JWT_EXPIRATION || '1h',
  REDIS_URL: process.env.REDIS_HOST || 'redis://redis-13742.c274.us-east-1-3.ec2.redns.redis-cloud.com',
};

const SECURITY_CONFIG = {
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS, 10) || 10, // Ensure it's an integer
};

const RATE_LIMIT_CONFIG = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000, // 15 minutes in milliseconds
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // Max 100 requests per window
};

const APP_SETTINGS = {
  SUPPORTED_LANGUAGES: process.env.SUPPORTED_LANGUAGES ? process.env.SUPPORTED_LANGUAGES.split(',') : ['en', 'es', 'fr'],
  DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',
};

module.exports = {
  JWT_CONFIG,
  SECURITY_CONFIG,
  RATE_LIMIT_CONFIG,
  APP_SETTINGS,
};
