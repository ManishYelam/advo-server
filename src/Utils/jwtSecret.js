const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('./constants');
const User = require('../Api/Models/User');
const { Op } = require('sequelize');

const generateToken = (user_info, secret = JWT_CONFIG.SECRET) => {
  try {
    return jwt.sign(user_info, secret, {
      expiresIn: JWT_CONFIG.EXPIRATION,
      algorithm: 'HS256',
    });
  } catch (error) {
    throw new Error('Token generation failed');
  }
};

const verifyToken = (token, secret = JWT_CONFIG.SECRET) => {
  try {
    const decoded = jwt.verify(token, secret);
    // console.log('JWT verified:', { userId: decoded.id });
    return decoded;
  } catch (error) {
    throw new Error('Token verification failed');
  }
};

const decodeToken = token => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new Error('Invalid token format');
    }
    // console.log('JWT decoded without verification:', { decoded });
    return {
      id: decoded.id,
      role: decoded.role,
    };
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    throw new Error('Token decoding failed');
  }
};

const refreshToken = (token, secret = JWT_CONFIG.SECRET) => {
  try {
    const decoded = jwt.verify(token, secret, { ignoreExpiration: true });
    const newToken = generateToken(decoded, secret);
    console.log('JWT refreshed:', { userId: decoded.id });
    return newToken;
  } catch (error) {
    console.error('Error refreshing JWT token:', error);
    throw new Error('Token refresh failed');
  }
};

const isTokenExpired = token => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token format');
    }
    const isExpired = Date.now() >= decoded.exp * 1000;
    console.log('Token expiration status:', { isExpired });
    return isExpired;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

const blacklistToken = async (token, logData) => {
  try {
    const decoded = decodeToken(token);
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    // Update user status in a single query
    const [updatedRows] = await User.update(
      {
        logged_in_status: false,
        token: null,
        expiresAt: null,
        expiredAt: new Date(),
      },
      {
        where: {
          id: decoded.id,
          logged_in_status: true,
          token: { [Op.ne]: null }, // Ensures token is not null
        },
      }
    );

    if (updatedRows === 0) {
      throw new Error('User not found or already logged out');
    }


    return { success: true, message: 'Logout successful. Your session has been securely ended.' };
  } catch (error) {
    console.error('Blacklist Token Error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken,
  isTokenExpired,
  blacklistToken,
};
