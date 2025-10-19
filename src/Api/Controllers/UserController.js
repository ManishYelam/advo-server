const fs = require('fs');
const path = require('path');
const { generateApplicationPDF } = require('../../Utils/generateApplicationPDF');
const { deleteFile } = require('../Helpers/fileHelper');
const { sendApplicantRegEmail } = require('../Services/email.Service');
const userService = require('../Services/UserService');
const FRONTEND_URL = process.env.FRONTEND_URL;

module.exports = {
  checkExistsEmail: async (req, res) => {
    try {
      const { email } = req.body;
      //console.log(email);
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      const user = await userService.checkExistsEmail(email);
      if (user) {
        return res.status(200).json({
          success: true,
          exists: true,
          message: 'Email already exists',
          user: {
            id: user.id,
            full_namename: user.name,
            email: user.email,
          },
        });
      } else {
        return res.status(200).json({
          success: true,
          exists: false,
          message: 'Email not found',
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  },

  createUser: async (req, res) => {
    try {
      const newUser = await userService.createUser(req.body);
      res.status(201).json({ success: true, message: 'User created successfully', user: newUser });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  resendVerification: async (req, res) => {
    try {
      const { userId } = req.query;
      const newUser = await userService.resendVerification(userId);
      res.status(200).json({ message: 'Resend verification link !', user: newUser });
    } catch (error) {
      res.status(500).json({ message: 'Resend failed: ' + error.message });
    }
  },

  verifyCreateUser: async (req, res) => {
    try {
      const { userId, otp } = req.query;
      const newUser = await userService.verifyCreateUser(userId, otp);
      res.status(200).json({ message: 'Account verified successfully!', user: newUser });
    } catch (error) {
      res.status(500).json({ message: 'Verification failed: ' + error.message });
    }
  },

  getAllUsersV2: async (req, res) => {
    try {
      const { page, limit, search, searchFields, ...filters } = req.body;
      const users = await userService.getAllUsersV2({ page, limit, search, searchFields, ...filters });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
      // res.status(200).json({ message: 'Fetch all users successfully', user: users });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User found successfully', user: user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body);
      if (updatedUser[0] === 0) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User updated successfully', user: req.body });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const deleted = await userService.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User deleted successfully', user: req.params.id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteUserRanges: async (req, res) => {
    try {
      const { start_id, end_id } = req.params;
      const start = parseInt(start_id, 10);
      const end = parseInt(end_id, 10);
      if (isNaN(start) || isNaN(end) || start > end) {
        return res.status(400).json({ error: 'Invalid ID range' });
      }
      const deletedCount = await userService.deleteUserRanges(start, end);
      return res.status(200).json({ message: `${deletedCount} users deleted successfully.` });
    } catch (error) {
      console.error('Error deleting users:', error);
      return res.status(500).json({ error: 'An error occurred while deleting users' });
    }
  },

  // Save Application Function
  saveApplication: async (req, res) => {
    console.log(req);

    let storedFilePath = null;

    try {
      const body = req.body;
      const UPLOAD_DIR = process.env.UPLOAD_DIR;

      // Helper function to ensure directory exists (sync)
      const ensureDirExists = dirPath => {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          // console.log(`✅ Created directory: ${dirPath}`);
        }
      };

      const formatDate = dateValue => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };

      const parseNumber = value => (value ? parseFloat(value) : 0);

      const user_data = {
        full_name: body.full_name,
        dob: formatDate(body.date_of_birth),
        age: body.age ? parseInt(body.age, 10) : '',
        phone_number: body.phone_number,
        email: body.email,
        gender: body.gender,
        occupation: body.occupation,
        adhar_number: body.adhar_number,
        address: body.address,
        additional_notes: body.additional_notes,
      };

      const case_data = {
        saving_account_start_date: formatDate(body.saving_account_start_date),
        deposit_type: body.deposit_type,
        deposit_duration_years: parseNumber(body.deposit_duration_years),
        fixed_deposit_total_amount: parseNumber(body.fixed_deposit_total_amount),
        interest_rate_fd: parseNumber(body.interest_rate_fd),
        saving_account_total_amount: parseNumber(body.saving_account_total_amount),
        interest_rate_saving: parseNumber(body.interest_rate_saving),
        recurring_deposit_total_amount: parseNumber(body.recurring_deposit_total_amount),
        interest_rate_recurring: parseNumber(body.interest_rate_recurring),
        dnyanrudha_investment_total_amount: parseNumber(body.dnyanrudha_investment_total_amount),
        dynadhara_rate: parseNumber(body.dynadhara_rate),
        verified: body.verified,
        documents: body.documents || {},
      };

      const payment_data = {
        method: body.method,
        payment_id: body.paymentId || body.payment_id,
        amount: body.order?.amount || body.amount || 0,
        amount_due: body.order?.amount_due || 0,
        amount_paid: body.order?.amount_paid || 0,
        attempts: body.order?.attempts || 0,
        created_at: body.order?.created_at ? new Date(body.order.created_at * 1000).toISOString() : null,
        currency: body.order?.currency,
        entity: body.order?.entity,
        order_id: body.order?.id || body.orderId || body.order_id,
        notes: body.order?.notes,
        offer_id: body.order?.offer_id,
        receipt: body.order?.receipt,
        status: body.status || body.order?.status || 'Pending',
      };

      // Save application data
      const saved = await userService.saveApplication(user_data, case_data, payment_data);

      if (!saved.success) {
        throw new Error('Failed to save application data');
      }

      // Generate PDF
      const pdfBuffer = await generateApplicationPDF(user_data, case_data, payment_data, body.documents);

      if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
        console.warn('⚠️ PDF generation returned invalid buffer');
      }

      // Store PDF file if generation was successful
      if (pdfBuffer && Buffer.isBuffer(pdfBuffer) && saved.user?.id) {
        try {
          const userFolder = path.join(UPLOAD_DIR, saved.user.id.toString());

          // Ensure user directory exists (sync)
          ensureDirExists(userFolder);

          // Generate unique filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `application_${saved.user.id}_${timestamp}.pdf`;
          storedFilePath = path.join(userFolder, filename);

          // Write file (sync)
          fs.writeFileSync(storedFilePath, pdfBuffer);
          // console.log(`✅ PDF stored successfully: ${storedFilePath}`);

          // Optional: You can store the file path in your database here
          await userService.updateApplicationFilePath(saved.user.id, storedFilePath, {
            applicationId: saved.case?.id || saved.application?.id, // Use saved.case.id
            documentType: 'application_pdf',
            fileSize: pdfBuffer.length,
            fileName: filename, // Pass the filename
            description: 'Application Form PDF',
          });
        } catch (storageError) {
          console.error('❌ Failed to store PDF file:', storageError);
          storedFilePath = null;
          // Continue with email even if storage fails
        }
      }

      // Send email with attachment (only if not logged in)
      if (!body.isLogin && saved.user?.id && user_data.email) {
        const reg_link = `${FRONTEND_URL}/applicant/${saved.user.id}`;

        await sendApplicantRegEmail(
          saved.user.id,
          user_data.full_name,
          user_data.email,
          reg_link,
          pdfBuffer, // Send buffer for email attachment
          storedFilePath // Pass file path for reference
        );
      }

      const result = {
        message: '✅ Application saved successfully!',
        data: saved,
        pdfGenerated: !!pdfBuffer,
        pdfStored: !!storedFilePath,
        storedFilePath: storedFilePath,
        userId: saved.user?.id,
      };

      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error saving application:', error);

      // Clean up stored file if there was an error after storage (sync)
      if (storedFilePath && fs.existsSync(storedFilePath)) {
        try {
          fs.unlinkSync(storedFilePath);
          // console.log(`🧹 Cleaned up file due to error: ${storedFilePath}`);
        } catch (cleanupError) {
          console.error('❌ Error cleaning up file:', cleanupError);
        }
      }

      return res.status(500).json({
        error: 'An error occurred while saving application',
        details: error.message,
      });
    }
  },
};
