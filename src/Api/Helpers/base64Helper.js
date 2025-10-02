module.exports = {
  // Encode a string to Base64
  encodeToBase64: input => {
    return Buffer.from(input).toString('base64');
  },

  // Decode a Base64 encoded string
  decodeFromBase64: encoded => {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  },

  // Encode a binary buffer to Base64
  encodeBufferToBase64: buffer => {
    return buffer.toString('base64');
  },

  // Decode a Base64 encoded string to a buffer
  decodeBase64ToBuffer: encoded => {
    return Buffer.from(encoded, 'base64');
  },

  // Encode JSON object to Base64
  encodeJsonToBase64: jsonObject => {
    const jsonString = JSON.stringify(jsonObject);
    return Buffer.from(jsonString).toString('base64');
  },

  // Decode Base64 string to JSON object
  decodeBase64ToJson: encoded => {
    const jsonString = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(jsonString);
  },
};
