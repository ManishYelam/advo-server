const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure 256-bit (50-byte) secret key suitable for HS256
const generateSecret = () => {
  return crypto.randomBytes(500).toString('hex');
};

// Save the generated secret to an environment file
const saveSecretToEnv = secret => {
  const envPath = path.resolve(__dirname, '../../.env');
  const jwtSecret = `JWT_SECRET=${secret}\n`;

  try {
    // Check if the .env file exists and append, otherwise create it
    if (fs.existsSync(envPath)) {
      fs.appendFileSync(envPath, jwtSecret);
    } else {
      fs.writeFileSync(envPath, jwtSecret);
    }
    console.log('✅ JWT secret successfully saved to .env file');
  } catch (err) {
    console.error('❌ Error writing to .env file:', err);
  }
};

// Main function to handle the secret generation and storage
const main = () => {
  const secret = generateSecret();
  console.log('Generated JWT Secret Key:', secret);

  // Save the secret to .env file for future use
  saveSecretToEnv(secret);
};

main();
