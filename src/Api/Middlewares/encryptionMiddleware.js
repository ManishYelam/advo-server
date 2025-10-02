const crypto = require('crypto');
const { ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, ENCRYPTION_IV } = process.env;

const encrypt = text => {
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, ENCRYPTION_IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = encryptedText => {
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, ENCRYPTION_IV);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const encryptionMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = JSON.parse(decrypt(req.body));
  }
  if (res.data) {
    res.data = encrypt(JSON.stringify(res.data));
  }
  next();
};

module.exports = encryptionMiddleware;
