const { hashPassword } = require('../Helpers/hashPassword');
const { Op } = require('sequelize');
const { generateOTPTimestamped, verifyOTPTimestamped, generateStrongPassword } = require('../../Utils/OTP');
const { sendLaunchCodeEmail, sendVerificationEmail } = require('./email.Service');
const { User, Role, Permission, Cases, Payment, UserDocument } = require('../Models/Association');
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
      const userName = `${newUser.full_name}`;
      await sendLaunchCodeEmail(newUser.id, userName, newUser.email, verificationUrl, otp);

      return newUser;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  },

  verifyCreateUser: async (userId, launchCode) => {
    try {
      // console.log(userId, launchCode);
      const user = await User.findByPk(userId);
      // console.log(user);
      if (!user) throw new Error('User not found');

      const { otp, expiryTime } = user;
      // console.log(otp, expiryTime);
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

  resendVerification: async (userId) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const { otp, expiryTime } = generateOTPTimestamped(10, 3600000, true);
      // console.log(otp, expiryTime);
      if (!otp || !expiryTime) throw new Error('Launch code is missing or expired');

      const generate_password = generateStrongPassword(16);
      const password = await hashPassword(generate_password);
      // Update user verification status
      user.isVerified = false;
      user.otp = otp;
      user.expiryTime = expiryTime;
      user.password = password;
      await user.save();
      const userName = `${user.full_name}`;
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
        full_name: data.full_name ?? user.full_name,
        date_of_birth: data.date_of_birth ?? user.date_of_birth,
        age: data.age ?? user.age,
        email: data.email ?? user.email,
        phone_number: data.phone_number ?? user.phone_number,
        adhar_number: data.adhar_number ?? user.adhar_number,
        occupation: data.occupation ?? user.occupation,
        gender: data.gender ?? user.gender,
        address: data.address ?? user.address,
        additional_notes: data.additional_notes ?? user.additional_notes,
        status: data.status ?? user.status,
        role_id: data.role_id ?? user.role_id,
        user_metadata: data.user_metadata
          ? { ...user.user_metadata, ...data.user_metadata }
          : user.user_metadata,
      };

      // Check edit_flag to determine if we should update password
      if (data.edit_flag === 'profile_edit') {
        // Profile edit - keep existing password, don't hash anything
        updatedUserData.password = user.password;
        console.log('Profile edit - preserving existing password');
      } else if (data.password) {
        // Regular update with password - hash the new password
        const hashedPassword = await hashPassword(data.password);
        updatedUserData.password = hashedPassword;
        console.log('Password update - hashing new password');
      } else {
        // No password provided and no edit_flag - keep existing password
        updatedUserData.password = user.password;
        console.log('No password provided - preserving existing password');
      }

      // Update user record
      await user.update(updatedUserData, { transaction });
      await transaction.commit();

      // Return user without password for security
      const userResponse = user.toJSON();
      delete userResponse.password;

      return {
        message: 'User updated successfully',
        user: userResponse
      };
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

  saveApplication: async (user_data, case_data, payment_data) => {
    const t = await sequelize.MAIN_DB_NAME.transaction();
    try {
      let user = await User.findOne({ where: { email: user_data.email }, transaction: t });

      if (user) {
        const hashedPassword = user_data.password ? await hashPassword(user_data.password) : user.password;
        await user.update({ ...user_data, password: hashedPassword }, { transaction: t });
      } else {
        if (user_data.password) { user_data.password = await hashPassword(user_data.password); }
        user = await User.create(user_data, { transaction: t });
      }

      const caseData = await Cases.create({ ...case_data, client_id: user.id }, { transaction: t });

      const paymentData = await Payment.create(
        { ...payment_data, client_id: user.id, case_id: caseData.id },
        { transaction: t }
      );

      await t.commit();

      return { success: true, user, case: caseData, payment: paymentData };
    } catch (error) {
      console.error(error.message);
      await t.rollback();
      return { success: false, error: "Transaction failed, all changes rolled back." };
    }
  },

  updateApplicationFilePath: async (userId, filePath, options = {}) => {
    try {
      const {
        applicationId = null,
        documentType = 'application_pdf',
        fileName = null,
        fileSize = 0,
        description = 'Application Form PDF',
        updateUserRecord = true
      } = options;

      // ✅ Step 1: Find the case
      const whereClause = { client_id: userId };
      if (applicationId) {
        whereClause.id = applicationId;
      }

      const caseRecord = await Cases.findOne({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      if (!caseRecord) {
        return {
          success: false,
          error: "No case found for this user. Please save application first."
        };
      }

      // ✅ Step 2: Extract only file paths from existing documents and add new one
      let currentFilePaths = [];

      if (caseRecord.documents) {
        if (Array.isArray(caseRecord.documents)) {
          // If it's already an array, extract file paths from objects or use strings directly
          currentFilePaths = caseRecord.documents.map(doc => {
            if (typeof doc === 'string') {
              return doc; // Already a file path string
            } else if (doc && doc.url) {
              return doc.url; // Extract url from object
            } else if (doc && doc.path) {
              return doc.path; // Extract path from object
            }
            return null;
          }).filter(Boolean); // Remove null values
        } else if (typeof caseRecord.documents === 'object' && caseRecord.documents.url) {
          // If it's a single object with url
          currentFilePaths = [caseRecord.documents.url];
        }
      }

      // Add the new file path (convert to relative path if needed)
      const relativeFilePath = filePath.replace(/^.*[\\\/]uploads[\\\/]/, '/uploads/');
      const updatedFilePaths = [...currentFilePaths, relativeFilePath];

      await caseRecord.update({
        documents: updatedFilePaths,
        updatedAt: new Date()
      });

      // ✅ Step 3: Create UserDocument with full details
      const userDocument = await UserDocument.create({
        user_id: userId,
        case_id: caseRecord.id,
        document_type: documentType,
        file_name: fileName || `application_${userId}_${Date.now()}.pdf`,
        file_path: filePath, // Store full path in UserDocument
        file_size: fileSize,
        mime_type: 'application/pdf',
        description,
        uploaded_by: userId,
        is_active: true,
        metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          documentVersion: '1.0'
        }
      });

      // ✅ Step 4: Optionally update User table
      if (updateUserRecord) {
        await User.update(
          {
            last_application_pdf: relativeFilePath, // Store relative path in User
            updatedAt: new Date()
          },
          { where: { id: userId } }
        );
      }

      // console.log(`✅ Case updated for user ${userId}`);
      // console.log(`✅ UserDocument created with ID: ${userDocument.id}`);
      // console.log(`✅ File paths in case: ${updatedFilePaths.length}`);

      return {
        success: true,
        message: 'File path stored successfully',
        caseId: caseRecord.id,
        userDocumentId: userDocument.id,
        documentsCount: updatedFilePaths.length
      };

    } catch (error) {
      console.error('❌ Error updating application file path:', error);
      return { success: false, error: error.message };
    }
  }

}
