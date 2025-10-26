const fs = require('fs');
const path = require('path');
const { generateApplicationPDF } = require('../../Utils/generateApplicationPDF');
const { deleteFile } = require('../Helpers/fileHelper');
const { sendApplicantRegEmail } = require('../Services/email.Service');
const userService = require('../Services/UserService');
const courtPdfService = require('../Services/CourtPdfService');
const pdfMergeService = require('../Services/pdfMergeService');
const UserDocument = require('../Models/UserDocument');
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
      // console.error('Error checking email:', error);
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
      // console.error('Error deleting users:', error);
      return res.status(500).json({ error: 'An error occurred while deleting users' });
    }
  },

  saveApplication: async (req, res) => {
    let storedFiles = [];
    let applicationPdfBuffer = null;

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

      // Clean up only temporary document files, keep previous court PDFs
      const cleanupTemporaryFiles = userId => {
        try {
          const userFolder = path.join(UPLOAD_DIR, userId.toString());
          const documentsFolder = path.join(userFolder, 'documents');

          // Only delete documents folder (temporary files), keep court PDFs
          if (fs.existsSync(documentsFolder)) {
            fs.rmSync(documentsFolder, { recursive: true, force: true });
          }
        } catch (cleanupError) {
          // Silent cleanup error - it's okay if folder doesn't exist
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

      // 6. Clean up only temporary files (documents), keep previous court PDFs
      cleanupTemporaryFiles(userId);

      // 7. Handle file uploads
      const userFolder = path.join(UPLOAD_DIR, userId.toString());
      ensureDirExists(userFolder);

      // Create application-specific folder for this new application
      const applicationId = saved.case?.id;
      const applicationFolder = path.join(userFolder, `application_${applicationId}`);
      ensureDirExists(applicationFolder);

      const exhibitDocuments = {
        'Exhibit A': [],
        'Exhibit B': [],
        'Exhibit C': [],
        'Exhibit D': [],
      };

      // Track processed files to prevent duplicates
      const processedFileHashes = new Set();

      // Function to create file hash for duplicate detection
      const createFileHash = (file, exhibit = null) => {
        const baseHash = `${file.originalname}_${file.size}_${file.mimetype}`;
        return exhibit ? `${baseHash}_${exhibit}` : baseHash;
      };

      // 7A. Handle application form PDF with duplicate detection
      if (req.files && req.files.applicationForm) {
        const applicationFormFile = req.files.applicationForm[0];

        // Create unique hash for this file to avoid duplicates
        const fileHash = createFileHash(applicationFormFile, 'application_form');

        if (!processedFileHashes.has(fileHash)) {
          processedFileHashes.add(fileHash);

          applicationPdfBuffer = fs.readFileSync(applicationFormFile.path);

          // Delete the temp file after reading (this is the multer temp file, not user upload)
          try {
            if (fs.existsSync(applicationFormFile.path)) {
              fs.unlinkSync(applicationFormFile.path);
            }
          } catch (deleteError) {
            // Silent delete error
          }
        } else {
          // Just skip without processing - don't delete user's uploaded file
        }
      }

      // 7B. Handle exhibit documents with comprehensive duplicate detection
      if (req.files && req.files.documents) {
        const documentFiles = req.files.documents;

        // Parse document metadata
        const documentMetadata = req.body.documentMetadata
          ? Array.isArray(req.body.documentMetadata)
            ? req.body.documentMetadata.map(meta => JSON.parse(meta))
            : [JSON.parse(req.body.documentMetadata)]
          : [];

        const documentsFolder = path.join(applicationFolder, 'documents');
        ensureDirExists(documentsFolder);

        let validFileCount = 0;
        let duplicateCount = 0;

        for (let i = 0; i < documentFiles.length; i++) {
          const file = documentFiles[i];
          const meta = documentMetadata[i] || {};

          // Create unique hash for this file to avoid duplicates
          const fileHash = createFileHash(file, meta.exhibit);

          if (processedFileHashes.has(fileHash)) {
            // Just skip without processing - don't delete user's uploaded file

            // Still need to clean up multer temp file for skipped duplicates
            try {
              if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            } catch (cleanupError) {
              // Silent cleanup error
            }

            duplicateCount++;
            continue;
          }
          processedFileHashes.add(fileHash);

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filename = `doc_${meta.exhibit}_${timestamp}_${safeFileName}`;
          const filePath = path.join(documentsFolder, filename);

          // Move file from multer temp location to our permanent location
          fs.renameSync(file.path, filePath);
          storedFiles.push(filePath);
          validFileCount++;

          // Organize by exhibit for court document generation
          if (exhibitDocuments[meta.exhibit]) {
            exhibitDocuments[meta.exhibit].push({
              filePath,
              fileType: file.mimetype,
              originalName: meta.originalName || file.originalname,
              exhibit: meta.exhibit,
            });
          }
        }

        // Clean up empty documents folder if no files were saved
        if (validFileCount === 0 && fs.existsSync(documentsFolder)) {
          try {
            fs.rmdirSync(documentsFolder);
          } catch (error) {
            // Ignore if not empty
          }
        }
      }

      // 8. Generate SINGLE Court Application PDF for this specific application
      let courtDocumentBuffer;
      let courtApplicationPath = null;
      const documentsFolderPath = path.join(applicationFolder, 'documents');

      // Capture user details for email
      const userEmail = user_data.email;
      const userName = user_data.full_name;
      const isLoginUser = !!req.user_info?.id;

      try {
        courtDocumentBuffer = await courtPdfService.generateCourtDocument(
          user_data,
          case_data,
          applicationPdfBuffer,
          exhibitDocuments
        );

        // Create unique filename for this application's court PDF
        const courtAppFilename = `court_application_${applicationId}_${Date.now()}.pdf`;
        courtApplicationPath = path.join(applicationFolder, courtAppFilename);
        fs.writeFileSync(courtApplicationPath, courtDocumentBuffer);

        // 9. SEND EMAIL IMMEDIATELY AFTER SUCCESSFUL COURT DOCUMENT GENERATION
        try {
          // Determine registration link based on login status
          let registrationLink = null;
          if (!isLoginUser) {
            registrationLink = `${FRONTEND_URL}/applicant/${userId}`;
          }

          await sendApplicantRegEmail(userId, userName, userEmail, registrationLink, courtDocumentBuffer);
        } catch (emailError) {
          console.error('❌ Error sending email with court application PDF:', emailError);
        }

        // 10. DELETE ONLY THIS APPLICATION'S DOCUMENTS DIRECTORY AFTER GENERATING COURT DOCUMENT
        // Keep the court PDF but remove temporary document files
        if (fs.existsSync(documentsFolderPath)) {
          try {
            fs.rmSync(documentsFolderPath, { recursive: true, force: true });
            // Remove documents folder from storedFiles array to prevent cleanup issues
            storedFiles = storedFiles.filter(file => !file.includes('/documents/'));
          } catch (deleteError) {
            console.error('❌ Error deleting documents directory:', deleteError);
          }
        }

        // 11. Save the court application PDF path to database for THIS application
        const saveResult = await userService.updateApplicationFilePath(userId, courtApplicationPath, {
          applicationId: saved.case?.id,
          documentType: 'court_application',
          fileName: path.basename(courtApplicationPath),
          fileSize: courtDocumentBuffer.length,
          description: 'Complete Court Application Document',
          updateUserRecord: true,
        });

        if (!saveResult.success) {
          throw new Error('Failed to save court application path to database');
        }
      } catch (courtDocError) {
        console.error('❌ Court application PDF generation failed:', courtDocError);
        throw new Error('Failed to generate court application document');
      }

      // 12. Return success response
      const result = {
        message: '✅ Application saved successfully! Court application PDF generated and email sent.',
        data: {
          ...saved,
          courtApplicationPath: courtApplicationPath,
          emailSent: true,
        },
        userId,
        applicationId,
      };

      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error saving application:', error);

      // Enhanced cleanup that also checks for any orphaned multer files
      const cleanupAllFiles = () => {
        // Clean up stored temporary files
        if (storedFiles.length > 0) {
          storedFiles.forEach(filePath => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (cleanupError) {
              // Silent cleanup error
            }
          });
        }

        // Clean up any remaining multer files that weren't processed
        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach(file => {
              try {
                if (file.path && fs.existsSync(file.path)) {
                  fs.unlinkSync(file.path);
                }
              } catch (cleanupError) {
                // Silent cleanup error
              }
            });
        }
      };

      cleanupAllFiles();

      return res.status(500).json({
        error: 'An error occurred while saving application',
        details: error.message,
      });
    }
  },

  updateApplication: async (req, res) => {
    let storedFiles = [];
    let applicationPdfBuffer = null;

    try {
      // 1️⃣ Parse application data
      if (!req.body.applicationData) {
        throw new Error('No applicationData found in request');
      }

      const applicationData = JSON.parse(req.body.applicationData);

      // Helper functions
      const ensureDirExists = dirPath => {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      };

      const formatDate = dateValue => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };

      const parseNumber = value => (value ? parseFloat(value) : 0);

      // 2️⃣ Extract user data
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

      // 3️⃣ Extract case data
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
      };

      // 4️⃣ Update existing application
      const applicationId = applicationData.case_id;
      if (!applicationId) throw new Error('Application ID is required for update');

      const updated = await userService.updateApplication(applicationId, user_data, case_data);
      if (!updated.success) throw new Error('Failed to update application data');

      const userId = updated.user?.id;
      if (!userId) throw new Error('User ID not found after updating');

      // 5️⃣ Prepare directories
      const userFolder = path.join(UPLOAD_DIR, userId.toString());
      ensureDirExists(userFolder);

      const applicationFolder = path.join(userFolder, `application_${applicationId}`);
      ensureDirExists(applicationFolder);

      const exhibitDocuments = { 'Exhibit A': [], 'Exhibit B': [], 'Exhibit C': [], 'Exhibit D': [] };
      const processedFileHashes = new Set();

      const createFileHash = (file, exhibit = null) => {
        const baseHash = `${file.originalname}_${file.size}_${file.mimetype}`;
        return exhibit ? `${baseHash}_${exhibit}` : baseHash;
      };

      let hasNewDocuments = false;
      let hasNewApplicationForm = false;

      // 6️⃣ Handle new application form PDF
      if (req.files && req.files.applicationForm) {
        const applicationFormFile = req.files.applicationForm[0];
        const fileHash = createFileHash(applicationFormFile, 'application_form');

        if (!processedFileHashes.has(fileHash)) {
          processedFileHashes.add(fileHash);
          hasNewApplicationForm = true;

          applicationPdfBuffer = fs.readFileSync(applicationFormFile.path);

          try {
            fs.unlinkSync(applicationFormFile.path);
          } catch {}
        }
      }

      // 7️⃣ Handle new exhibit documents
      if (req.files && req.files.documents) {
        const documentFiles = req.files.documents;
        const documentMetadata = req.body.documentMetadata
          ? Array.isArray(req.body.documentMetadata)
            ? req.body.documentMetadata.map(meta => JSON.parse(meta))
            : [JSON.parse(req.body.documentMetadata)]
          : [];

        const documentsFolder = path.join(applicationFolder, 'documents');
        ensureDirExists(documentsFolder);

        for (let i = 0; i < documentFiles.length; i++) {
          const file = documentFiles[i];
          const meta = documentMetadata[i] || {};

          const fileHash = createFileHash(file, meta.exhibit);
          if (processedFileHashes.has(fileHash)) {
            try {
              fs.unlinkSync(file.path);
            } catch {}
            continue;
          }

          processedFileHashes.add(fileHash);
          hasNewDocuments = true;

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filename = `doc_${meta.exhibit}_${timestamp}_${safeFileName}`;
          const filePath = path.join(documentsFolder, filename);

          fs.renameSync(file.path, filePath);
          storedFiles.push(filePath);

          if (exhibitDocuments[meta.exhibit]) {
            exhibitDocuments[meta.exhibit].push({
              filePath,
              fileType: file.mimetype,
              originalName: meta.originalName || file.originalname,
              exhibit: meta.exhibit,
            });
          }
        }
      }

      let courtApplicationPath = null;

      // 8️⃣ Regenerate court PDF if new files uploaded
      if (hasNewDocuments || hasNewApplicationForm) {
        console.log(`🔄 Regenerating court PDF due to new uploads for application ${applicationId}`);

        // Fetch and delete existing court PDF
        const existingCourtPath = await userService.getApplicationCourtPath(applicationId);
        if (existingCourtPath && fs.existsSync(existingCourtPath)) {
          try {
            fs.unlinkSync(existingCourtPath);
            console.log(`🗑️ Deleted old court PDF: ${existingCourtPath}`);
          } catch (err) {
            console.error(`❌ Failed to delete old court PDF: ${existingCourtPath}`, err);
          }
        }

        // Delete any old PDFs in folder for cleanup
        const files = fs.readdirSync(applicationFolder);
        files.forEach(file => {
          if (file.startsWith('court_application_') && file.endsWith('.pdf')) {
            const filePath = path.join(applicationFolder, file);
            try {
              fs.unlinkSync(filePath);
            } catch {}
          }
        });

        // Generate new court PDF
        const courtDocumentBuffer = await courtPdfService.generateCourtDocument(
          user_data,
          case_data,
          applicationPdfBuffer,
          exhibitDocuments
        );

        const courtAppFilename = `court_application_${applicationId}_${Date.now()}.pdf`;
        courtApplicationPath = path.join(applicationFolder, courtAppFilename);
        fs.writeFileSync(courtApplicationPath, courtDocumentBuffer);

        console.log(`✅ Generated new court PDF: ${courtAppFilename}`);

        // Update DB file path
        const saveResult = await userService.updateApplicationFilePath(userId, courtApplicationPath, {
          applicationId,
          documentType: 'court_application',
          fileName: path.basename(courtApplicationPath),
          fileSize: courtDocumentBuffer.length,
          description: 'Updated Court Application Document',
          updateUserRecord: true,
        });

        if (!saveResult.success) throw new Error('Failed to update court application path in database');

        // Clean up temporary documents
        const documentsFolderPath = path.join(applicationFolder, 'documents');
        if (fs.existsSync(documentsFolderPath)) {
          try {
            fs.rmSync(documentsFolderPath, { recursive: true, force: true });
            storedFiles = storedFiles.filter(f => !f.includes('/documents/'));
            console.log(`🧹 Cleaned up temporary documents folder`);
          } catch (deleteError) {
            console.error('❌ Error deleting documents directory:', deleteError);
          }
        }
      } else {
        console.log(`ℹ️ No new uploads for application ${applicationId}, skipping PDF regeneration`);
        courtApplicationPath = await userService.getApplicationCourtPath(applicationId);
      }

      // 9️⃣ Success response
      const responseMessage =
        hasNewDocuments || hasNewApplicationForm
          ? '✅ Application updated successfully! New court application PDF generated.'
          : '✅ Application updated successfully! Court PDF unchanged.';

      return res.status(200).json({
        message: responseMessage,
        data: {
          ...updated,
          courtApplicationPath,
          courtPdfRegenerated: hasNewDocuments || hasNewApplicationForm,
        },
        userId,
        applicationId,
      });
    } catch (error) {
      console.error('❌ Error updating application:', error);

      // 🔟 Cleanup
      const cleanupAllFiles = () => {
        storedFiles.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch {}
        });

        if (req.files) {
          Object.values(req.files)
            .flat()
            .forEach(file => {
              try {
                if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
              } catch {}
            });
        }
      };

      cleanupAllFiles();

      return res.status(500).json({
        error: 'An error occurred while updating application',
        details: error.message,
      });
    }
  },

  // Get merged PDF file
  getMergedPdf: async (req, res) => {
    try {
      const { userId } = req.params;

      // Get the merged PDF from UserDocument table
      const mergedDocument = await UserDocument.findOne({
        where: {
          user_id: userId,
          document_type: 'merged_court_document',
          is_active: true,
        },
        order: [['createdAt', 'DESC']],
      });

      if (!mergedDocument) {
        return res.status(404).json({ error: 'Merged PDF not found' });
      }

      if (!fs.existsSync(mergedDocument.file_path)) {
        return res.status(404).json({ error: 'Merged PDF file not found on server' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${mergedDocument.file_name}"`);

      const fileStream = fs.createReadStream(mergedDocument.file_path);
      fileStream.pipe(res);
    } catch (error) {
      // console.error('Error getting merged PDF:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Check merge status
  checkMergeStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const jobStatus = pdfMergeService.getJobStatus(userId);

      // Get the merged document from database
      const mergedDocument = await UserDocument.findOne({
        where: {
          user_id: userId,
          document_type: 'merged_court_document',
          is_active: true,
        },
        order: [['createdAt', 'DESC']],
      });

      return res.status(200).json({
        userId,
        jobStatus,
        mergedFile: mergedDocument
          ? {
              fileName: mergedDocument.file_name,
              fileSize: mergedDocument.file_size,
              description: mergedDocument.description,
              createdAt: mergedDocument.createdAt,
              documentType: mergedDocument.document_type,
            }
          : null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // console.error('Error checking merge status:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Manual trigger for merge (for testing)
  triggerMerge: async (req, res) => {
    try {
      const { userId } = req.params;

      const mergeResult = await pdfMergeService.mergeUserPDFs(userId);
      return res.status(200).json(mergeResult);
    } catch (error) {
      // console.error('Error triggering merge:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Manual trigger for cleanup (for testing)
  triggerCleanup: async (req, res) => {
    try {
      const { userId } = req.params;

      const cleanupResult = await pdfMergeService.cleanupOriginalPDFs(userId);
      return res.status(200).json(cleanupResult);
    } catch (error) {
      // console.error('Error triggering cleanup:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Generate court document only (for testing)
  generateCourtDoc: async (req, res) => {
    try {
      const { userId } = req.params;

      // Get user data from database
      const userData = await userService.getUserById(userId);
      const caseData = await userService.getCaseByUserId(userId);

      const courtDocBuffer = await courtPdfService.generateSimplifiedCourtDocument(userData, caseData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="court_document_${userId}.pdf"`);
      res.send(courtDocBuffer);
    } catch (error) {
      // console.error('Error generating court document:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Test environment
  testEnv: async (req, res) => {
    try {
      return res.status(200).json({
        UPLOAD_DIR,
        FRONTEND_URL,
        NODE_ENV: process.env.NODE_ENV,
        uploadPathExists: fs.existsSync(UPLOAD_DIR),
        currentDir: __dirname,
        rootDir: path.join(__dirname, '../../..'),
      });
    } catch (error) {
      // console.error('Error in testEnv:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // NEW: Clean up all temporary files for a user (manual cleanup endpoint)
  cleanupUserFiles: async (req, res) => {
    try {
      const { userId } = req.params;

      const userFolder = path.join(UPLOAD_DIR, userId.toString());
      let deletedCount = 0;
      let errorCount = 0;

      if (fs.existsSync(userFolder)) {
        // console.log(`🧹 Manual cleanup for user ${userId}`);

        // Delete all files in user folder except merged court documents
        const files = fs.readdirSync(userFolder);
        files.forEach(file => {
          try {
            const filePath = path.join(userFolder, file);
            if (fs.statSync(filePath).isFile() && !file.includes('merged_court_document')) {
              fs.unlinkSync(filePath);
              deletedCount++;
              // console.log(`  ✅ Deleted: ${file}`);
            }
          } catch (error) {
            errorCount++;
            // console.error(`  ❌ Failed to delete ${file}:`, error.message);
          }
        });

        // ✅ OPTIMIZED: Delete entire temp_documents directory at once
        const tempDocsFolder = path.join(userFolder, 'temp_documents');
        if (fs.existsSync(tempDocsFolder)) {
          // console.log(`  🗑️ Deleting entire temp_documents directory`);
          fs.rmSync(tempDocsFolder, { recursive: true, force: true });
          // console.log(`  ✅ Successfully deleted temp_documents directory`);
          deletedCount++; // Count the directory deletion as one operation
        }
      }

      return res.status(200).json({
        message: 'Manual cleanup completed',
        deletedCount,
        errorCount,
        userId,
      });
    } catch (error) {
      // console.error('Error in manual cleanup:', error);
      return res.status(500).json({ error: error.message });
    }
  },
};
