const crypto = require('crypto');
const { prefixes } = require('../Config/Database/Data');

const generateUniqueID = prefix => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}${randomDigits}`;
};

const generateUniqueIDForHealth = department => {
  const prefix = prefixes[department];
  if (!prefix) {
    throw new Error(`Invalid department name: ${department}`);
  }
  return generateUniqueID(prefix);
};
// console.log(prefixes);
// console.log('Generated Pharmacy ID:', generateUniqueIDForHealth("partnership"));

module.exports = { generateUniqueID, generateUniqueIDForHealth };
