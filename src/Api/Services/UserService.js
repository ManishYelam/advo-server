const { hashPassword } = require('../Helpers/hashPassword');
const { Op } = require('sequelize');
const { generateOTPTimestamped, verifyOTPTimestamped, generateStrongPassword } = require('../../Utils/OTP');
const { sendLaunchCodeEmail, sendVerificationEmail } = require('./email.Service');
const { User, Role, Permission } = require('../Models/Association');
const { sequelize } = require('../../Config/Database/db.config');

module.exports = {
  createUser: async data => {
    try {
      const { otp, expiryTime } = generateOTPTimestamped(10, 3600000, true);
      Object.assign(data, { otp, expiryTime });
      const hashedPassword = await hashPassword(data.password);
      data.password = hashedPassword;

      const newUser = await User.create(data);

      const verificationUrl = `https://mbvdvt7z-5000.inc1.devtunnels.ms/api/users/verify?userId=${newUser.id}&otp=${otp}`;
      const userName = `${newUser.first_name} ${newUser.last_name}`;
      await sendLaunchCodeEmail(newUser.id, userName, newUser.email, verificationUrl, otp);

      return newUser;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  },

  verifyCreateUser: async (userId, launchCode) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const { otp, expiryTime } = user;
      if (!otp || !expiryTime) throw new Error('Launch code is missing or expired');

      const { isValid, message } = verifyOTPTimestamped(launchCode, otp, expiryTime);
      if (!isValid) throw new Error(message);

      const generate_password = generateStrongPassword(16);
      const password = await hashPassword(generate_password);

      // Update user verification status
      user.isVerified = true;
      user.otp = null;
      user.expiryTime = null;
      user.password = password;
      await user.save();

      const userName = `${user.first_name} ${user.last_name}`;
      await sendVerificationEmail(userName, user.email, generate_password);

      return user;
    } catch (error) {
      throw new Error(`${error.message}`);
    }
  },

  getAllUsers: async () => {
    return User.findAll();
  },

  getAllUsersV2: async ({ page = 1, limit = 10, search = '', searchFields = [], filters = {} }) => {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = {};

      // **Apply Filters Dynamically**
      if (filters.status) whereConditions.status = filters.status;
      if (filters.role) whereConditions.role = filters.role;
      if (filters.isVerified) whereConditions.isVerified = filters.isVerified;
      if (filters.logged_in_status) whereConditions.logged_in_status = filters.logged_in_status;
      if (filters.phone_number) whereConditions.phone_number = { [Op.like]: `%${filters.phone_number}%` };
      if (filters.email) whereConditions.email = { [Op.like]: `%${filters.email}%` };

      // **Apply Dynamic Search Using `.map()`**
      let searchConditions =
        search && searchFields.length > 0 ? searchFields.map(field => ({ [field]: { [Op.like]: `%${search}%` } })) : [];

      // **Final WHERE condition combining filters & search**
      let finalWhereCondition = { ...whereConditions };
      if (searchConditions.length > 0) {
        finalWhereCondition[Op.or] = searchConditions;
      }

      // **Fetch Users with Filters, Pagination & Sorting**
      const { rows, count } = await User.findAndCountAll({
        where: finalWhereCondition,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        message: '✅ Users fetched successfully.',
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows,
      };
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error.message);
      throw new Error(`❌ Error in getAllUsers: ${error.message}`);
    }
  },

  getUserById: async id => {
    const user = await User.findByPk(id);
    return user;
  },

  getUserByEmail: async email => {
    const user = await User.findOne({
      where: { email: userEmail },
      include: [
        {
          model: Role,
          // include: [{ model: Permission }],
        },
      ],
    });
    return user;
  },

  checkExistsEmail: async email => {
    const user = await User.findOne({ where: { email } });
    return user;
  },

  updateUser: async (userId, data) => {
    const transaction = await sequelize.MAIN_DB_NAME.transaction();
    try {
      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        throw new Error('User not found');
      }
      // Prepare updated user data
      const updatedUserData = {
        username: data.username ?? user.username,
        email: data.email ?? user.email,
        first_name: data.first_name ?? user.first_name,
        last_name: data.last_name ?? user.last_name,
        date_of_birth: data.date_of_birth ?? user.date_of_birth,
        phone_number: data.phone_number ?? user.phone_number,
        whatsapp_number: data.whatsapp_number ?? user.whatsapp_number,
        address: data.address ?? user.address,
        status: data.status ?? user.status,
        role_id: data.role_id ?? user.role_id,
        user_metadata: data.user_metadata ? { ...user.user_metadata, ...data.user_metadata } : user.user_metadata,
      };
      // Update user record
      await user.update(updatedUserData, { transaction });
      await transaction.commit();
      return { updatedUser: user };
    } catch (error) {
      await transaction.rollback();
      throw new Error('Error updating user: ' + error.message);
    }
  },

  deleteUser: id => {
    return User.destroy({ where: { id } });
  },

  deleteUserRanges: async (startId, endId) => {
    const deletedCount = await User.destroy({
      where: {
        id: {
          [Op.between]: [startId, endId],
        },
      },
    });
    return deletedCount;
  },
};
