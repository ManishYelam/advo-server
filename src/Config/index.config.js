module.exports = {
  db: require('./Database/db.config'),
  mysql: require('./Database/mysql.config'),
  sequelize: require('./Database/sequelize.config'),
  baseUrls: require('./Setting/baseurls.config'),
  cache: require('./Setting/cache.config'),
  cors: require('./Setting/cors.config'),
  nodemailer: require('./Setting/nodemailer.config'),
  rateLimiter: require('./Setting/rateLimiter.config'),
  redis: require('./Setting/redis.config'),
  security: require('./Setting/security.config'),
  socket: require('./Setting/socket.config'),
};
