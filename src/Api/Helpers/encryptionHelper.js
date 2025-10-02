const crypto = require('crypto');
const { promisify } = require('util');

// Constants
const ALGORITHM = 'aes-256-cbc'; // AES algorithm
const IV_LENGTH = 16; // IV length for AES
const KEY_LENGTH = 32; // AES-256 key length

// Utility to generate a random initialization vector (IV)
const generateIv = () => crypto.randomBytes(IV_LENGTH);

// Utility to generate a random encryption key
const generateKey = () => crypto.randomBytes(KEY_LENGTH);

// Encrypt data using AES-256-CBC
const encrypt = (text, key) => {
  const iv = generateIv();
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

// Decrypt data using AES-256-CBC
const decrypt = (encryptedText, key) => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Asynchronous key generation (useful for generating keys and storing them securely)
const generateKeyAsync = async () => {
  const randomBytesAsync = promisify(crypto.randomBytes);
  return randomBytesAsync(KEY_LENGTH);
};

module.exports = {
  generateIv,
  generateKey,
  encrypt,
  decrypt,
  generateKeyAsync,
};
