const bcrypt = require('bcrypt');
const { SALT_ROUNDS } = require('../../Utils/constants');

module.exports = {
  hashPassword: async password => {
    return bcrypt.hash(password, SALT_ROUNDS || 10);
  },

  comparePassword: async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
  },
};
