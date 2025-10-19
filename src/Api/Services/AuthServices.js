const { Op } = require('sequelize');
const { JWT_CONFIG } = require('../../Utils/constants');
const { comparePassword, hashPassword } = require('../Helpers/hashPassword');
const { generateToken, verifyToken, blacklistToken } = require('../../Utils/jwtSecret');
const { generateOTPTimestamped } = require('../../Utils/OTP');
const { sendResetPasswordCodeEmail, sendPasswordChangeEmail } = require('../Services/email.Service');
const { User, UserLog, Role, Permission, Organization } = require('../Models/Association');

const AuthService = {
  login: async (email, password, clientIp, userAgent) => {
    try {
      // Fetch user with associated role
      const user = await User.findOne({
        where: { email },
      });

      if (!user) throw new Error('⚠️ Oops! The email or password you entered is incorrect. Please try again.');

      // Validate password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword)
        throw new Error('🔒 Incorrect password! Please check and try again. If you forgot your password, reset it.');
      // if (!user.isVerified)
      //   throw new Error('🚀 Your account is not verified yet! Please check your email and verify your account before logging in.');
      if (user.status !== 'active')
        throw new Error('⛔ Your account is currently inactive. Please contact support for assistance.');

      // Extract necessary user data for the token
      const user_info = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        date_of_birth: user.date_of_birth,
        phone_number: user.phone_number,
        address: user.address,
        status: user.status,
        isVerified: user.isVerified,
        user_metadata: user.user_metadata ?? {},
      };

      console.log(user_info);

      // Generate JWT token
      const token = generateToken(user_info); // Fixed function call

      // Update user login status in a single database query
      await user.update({
        logged_in_status: true,
        last_login_at: new Date(),
        token,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
        expiredAt: null,
      });

      // Remove token field from the user object before returning
      const userResponse = { ...user.get({ plain: true }) };
      delete userResponse.token; // Remove token from response

      const logData = {
        user_id: user.id,
        source_ip: clientIp,
        device: userAgent,
        related_info: `Session start & end times`,
        jwt_token: token,
        action: 'login',
      };

      return { token, user: userResponse };
    } catch (error) {
      console.error('Login error:', error.message);
      throw new Error(`⚠️ Login failed. ${error.message}`);
    }
  },

  logout: async (userId, token, clientIp, userAgent) => {
    if (!token) {
      throw new Error('No token provided for logout');
    }

    if (!userId || !clientIp || !userAgent) {
      throw new Error('User ID, IP address and device are required for logout');
    }

    try {
      const logData = {
        user_id: userId,
        source_ip: clientIp,
        device: userAgent,
        related_info: 'Session start & end times',
        logoff_by: 'USER',
        jwt_token: token,
        action: 'logout',
      };

      // Execute both operations in parallel
      const logout = await blacklistToken(token, logData);

      return { logout };
    } catch (error) {
      console.error('Logout error:', error.message);
      throw new Error('Logout failed. Please try again.');
    }
  },

  changePassword: async (userId, old_password, new_password) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await comparePassword(old_password, user.password);
      if (!isMatch) {
        throw new Error('Old password is incorrect');
      }

      // Ensure new password is different (direct string comparison before hashing)
      if (old_password === new_password) {
        throw new Error('New password cannot be the same as the old password');
      }

      const newHashedPassword = await hashPassword(new_password, 10);

      // Update the password in a single database query
      await user.update({ password: newHashedPassword });

      const userName = `${user.first_name} ${user.last_name}`;
      await sendPasswordChangeEmail(userId, user.email, userName);

      return { message: 'Your password has been updated successfully! For security, please log in again with your new password.' };
    } catch (error) {
      throw new Error(`Password update failed. Please try again or contact support if the issue persists. Error: ${error.message}`);
    }
  },

  resetPassword: async (email, otp, new_password) => {
    try {
      const user = await User.findOne({ where: { email: email } });
      if (!user) {
        throw new Error('User not found');
      }

      if (user.otp !== otp) {
        throw new Error(
          '⚠️ Oops! The OTP you entered is incorrect. Please double-check and try again. If you didn’t request a password reset, please ignore this message or request a new OTP. 🔄'
        );
      }

      const newHashedPassword = await hashPassword(new_password, 10);
      await user.update({ password: newHashedPassword });

      const userName = `${user.first_name} ${user.last_name}`;
      await sendPasswordChangeEmail(user.id, user.email, userName);

      return { message: 'Your password has been updated successfully! For security, please log in again with your new password.' };
    } catch (error) {
      throw new Error(`${error.message}`);
    }
  },

  forgetPassword: async email => {
    try {
      const user = await User.findOne({ where: { email, status: 'active' } });
      if (!user) {
        throw new Error('User not found');
      }
      // Generate OTP & expiry time
      const { otp, expiryTime } = generateOTPTimestamped(10, 300000, true);
      await user.update({ otp, expiryTime });
      // Send OTP email
      const userName = `${user.full_name}`;
      await sendResetPasswordCodeEmail(user.id, userName, user.email, otp);
      return { message: 'An OTP has been sent to your email. Please verify to proceed with password reset.' };
    } catch (error) {
      throw new Error(`Forgot password request failed: ${error.message}`);
    }
  },

  upsertOrganization: async data => {
    try {
      const existingOrg = await Organization.findOne();
      // if (data.emailSettings.password) {
      //   data.emailSettings.password = await hashPassword(data.emailSettings.password);
      // }
      if (existingOrg) {
        await existingOrg.update(data);
        return { ...existingOrg.toJSON(), isNewRecord: false };
      } else {
        const newOrg = await Organization.create(data);
        return { ...newOrg.toJSON(), isNewRecord: true };
      }
    } catch (error) {
      console.error('Error in upsertOrganization:', error);
      throw new Error('Failed to upsert organization');
    }
  },

  getOrganization: async () => {
    try {
      const organization = await Organization.findOne();
      return organization ? organization.toJSON() : null;
    } catch (error) {
      console.error('Error in getOrganization:', error);
      throw new Error('Failed to fetch organization details');
    }
  },
};

module.exports = AuthService;
