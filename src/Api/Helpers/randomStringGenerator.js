const crypto = require('crypto');

module.exports = {
  generateRandomString: (length = 16) => {
    return crypto.randomBytes(length).toString('hex');
  },
};
