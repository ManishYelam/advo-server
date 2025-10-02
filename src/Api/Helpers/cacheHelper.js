const redis = require('redis');
const client = redis.createClient();

module.exports = {
  // Store data in cache
  setCache: (key, value, expiration = 3600) => {
    try {
      client.setex(key, expiration, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting cache:', error.message);
    }
  },

  // Retrieve data from cache
  getCache: (key, callback) => {
    client.get(key, (err, data) => {
      if (err) {
        console.error('Error getting cache:', err.message);
        callback(null);
      } else {
        callback(JSON.parse(data));
      }
    });
  },

  // Clear specific cache key
  clearCache: key => {
    client.del(key, (err, response) => {
      if (err) {
        console.error('Error clearing cache:', err.message);
      }
    });
  },
};

// const cacheHelper = require('./cacheHelper');

// Caching data from an expensive query
// app.get('/data', (req, res) => {
//   const cacheKey = 'data';

//   cacheHelper.getCache(cacheKey, cachedData => {
//     if (cachedData) return res.json(cachedData);

//     // Simulate expensive operation
//     const data = getDataFromDB();
//     cacheHelper.setCache(cacheKey, data);

//     res.json(data);
//   });
// });
