const fs = require('fs');
const path = require('path');
const { generateApplicationPDF } = require('../../Utils/generateApplicationPDF');
const { deleteFile } = require('../Helpers/fileHelper');
const { sendApplicantRegEmail } = require('../Services/email.Service');
const userService = require('../Services/UserService');
const FRONTEND_URL = process.env.FRONTEND_URL;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../..', 'UPLOAD_DIR');

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
    let storedFiles = []; // Track all stored files for cleanup

    try {
      // 1. Parse application data from form data
      if (!req.body.applicationData) {
        throw new Error('No applicationData found in request');
      }

      const applicationData = JSON.parse(req.body.applicationData);

      const ensureDirExists = dirPath => {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      };

      const formatDate = dateValue => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };

      const parseNumber = value => (value ? parseFloat(value) : 0);

      // 2. Extract user data
      const user_data = {
        full_name: applicationData.full_name,
        dob: formatDate(applicationData.date_of_birth),
        age: applicationData.age ? parseInt(applicationData.age, 10) : '',
        phone_number: applicationData.phone_number,
        email: applicationData.email,
        gender: applicationData.gender,
        occupation: applicationData.occupation,
        adhar_number: applicationData.adhar_number,
        address: applicationData.address,
        additional_notes: applicationData.additional_notes,
      };

      // 3. Extract case data
      const case_data = {
        saving_account_start_date: formatDate(applicationData.saving_account_start_date),
        deposit_type: applicationData.deposit_type,
        deposit_duration_years: parseNumber(applicationData.deposit_duration_years),
        fixed_deposit_total_amount: parseNumber(applicationData.fixed_deposit_total_amount),
        interest_rate_fd: parseNumber(applicationData.interest_rate_fd),
        saving_account_total_amount: parseNumber(applicationData.saving_account_total_amount),
        interest_rate_saving: parseNumber(applicationData.interest_rate_saving),
        recurring_deposit_total_amount: parseNumber(applicationData.recurring_deposit_total_amount),
        interest_rate_recurring: parseNumber(applicationData.interest_rate_recurring),
        dnyanrudha_investment_total_amount: parseNumber(applicationData.dnyanrudha_investment_total_amount),
        dynadhara_rate: parseNumber(applicationData.dynadhara_rate),
        verified: applicationData.verified,
        documents: {},
      };

      // 4. Extract payment data
      const status = applicationData.status || applicationData.order?.status || 'Pending';
      const amount = applicationData.order?.amount || applicationData.amount || 0;
      let amount_due = applicationData.order?.amount_due || applicationData.amount_due || 0;
      let amount_paid = applicationData.order?.amount_paid || applicationData.amount_paid || 0;

      if (status === 'Paid') {
        amount_paid = amount;
        amount_due = 0;
      }

      const payment_data = {
        method: applicationData.method,
        payment_id: applicationData.paymentId || applicationData.payment_id,
        amount,
        amount_due,
        amount_paid,
        attempts: applicationData.order?.attempts || 0,
        created_at: applicationData.order?.created_at ? new Date(applicationData.order.created_at * 1000).toISOString() : null,
        currency: applicationData.order?.currency,
        entity: applicationData.order?.entity,
        order_id: applicationData.order?.id || applicationData.orderId || applicationData.order_id,
        notes: applicationData.order?.notes,
        offer_id: applicationData.order?.offer_id,
        receipt: applicationData.order?.receipt,
        status,
      };

      // 5. Save basic application data first
      const saved = await userService.saveApplication(user_data, case_data, payment_data);
      if (!saved.success) throw new Error('Failed to save application data');

      const userId = saved.user?.id;
      if (!userId) throw new Error('User ID not found after saving');

      // 6. Handle file uploads
      const userFolder = path.join(UPLOAD_DIR, userId.toString());
      ensureDirExists(userFolder);

      // Handle application form PDF
      if (req.files && req.files.applicationForm) {
        const applicationFormFile = req.files.applicationForm[0];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `application_${userId}_${timestamp}.pdf`;
        const filePath = path.join(userFolder, filename);
        fs.renameSync(applicationFormFile.path, filePath);
        storedFiles.push(filePath);

        await userService.updateApplicationFilePath(userId, filePath, {
          applicationId: saved.case?.id,
          documentType: 'application_pdf',
          fileSize: applicationFormFile.size,
          fileName: filename,
          description: 'Application Form PDF',
        });
      }

      // Handle exhibit documents
      if (req.files && req.files.documents) {
        const documentFiles = req.files.documents;
        const documentMetadata = req.body.documentMetadata
          ? Array.isArray(req.body.documentMetadata)
            ? req.body.documentMetadata.map(meta => JSON.parse(meta))
            : [JSON.parse(req.body.documentMetadata)]
          : [];

        const documentsFolder = path.join(userFolder, 'documents');
        ensureDirExists(documentsFolder);

        const savedDocuments = [];

        for (let i = 0; i < documentFiles.length; i++) {
          const file = documentFiles[i];
          const meta = documentMetadata[i] || {};
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filename = `doc_${meta.exhibit}_${timestamp}_${safeFileName}`;
          const filePath = path.join(documentsFolder, filename);
          fs.renameSync(file.path, filePath);
          storedFiles.push(filePath);

          savedDocuments.push({
            exhibit: meta.exhibit,
            fileName: filename,
            originalName: meta.originalName || file.originalname,
            filePath: filePath,
            fileSize: file.size,
            fileType: file.mimetype,
            documentId: meta.documentId,
            uploadedAt: new Date().toISOString(),
          });
        }

        if (savedDocuments.length > 0) {
          // await userService.saveApplicationDocuments(userId, saved.case?.id, savedDocuments);
        }
      }

      // 7. Generate PDF if not already uploaded (fallback)
      let pdfBuffer = null;
      if (!req.files || !req.files.applicationForm) {
        try {
          pdfBuffer = await generateApplicationPDF(user_data, case_data, payment_data, applicationData.documents);
          if (pdfBuffer && Buffer.isBuffer(pdfBuffer)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `generated_application_${userId}_${timestamp}.pdf`;
            const filePath = path.join(userFolder, filename);
            fs.writeFileSync(filePath, pdfBuffer);
            storedFiles.push(filePath);
          }
        } catch (pdfError) {}
      }

      // 8. Send email notification (if needed)
      if (!applicationData.isLogin && userId && user_data.email) {
        try {
          const reg_link = `${FRONTEND_URL}/applicant/${userId}`;
          const pdfPath = storedFiles.find(file => file.includes('application_'));
          await sendApplicantRegEmail(
            userId,
            user_data.full_name,
            user_data.email,
            reg_link,
            pdfPath ? fs.readFileSync(pdfPath) : pdfBuffer,
            pdfPath
          );
        } catch (emailError) {}
      }

      // 9. Return success response
      const result = {
        message: '✅ Application saved successfully!',
        data: {
          ...saved,
          documentsCount: storedFiles.length,
          storedFiles: storedFiles.map(file => path.basename(file)),
        },
        userId,
      };

      return res.status(200).json(result);
    } catch (error) {
      if (storedFiles.length > 0) {
        storedFiles.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (cleanupError) {}
        });
      }

      return res.status(500).json({
        error: 'An error occurred while saving application',
        details: error.message,
      });
    }
  },
};
