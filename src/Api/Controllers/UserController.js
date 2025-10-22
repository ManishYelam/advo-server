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

  saveApplication: async (req, res) => {
    console.log('🎯 Save application controller called');
    console.log('📦 Request body keys:', Object.keys(req.body));
    console.log('📁 Request files:', req.files);

    let storedFiles = [];
    let applicationPdfBuffer = null;

    try {
      // 1. Parse application data from form data
      if (!req.body.applicationData) {
        throw new Error('No applicationData found in request');
      }

      const applicationData = JSON.parse(req.body.applicationData);
      console.log('👤 User data received for:', applicationData.full_name);

      const ensureDirExists = dirPath => {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`📁 Created directory: ${dirPath}`);
        }
      };

      // Clean up previous temporary files for this user
      const cleanupPreviousTempFiles = userId => {
        try {
          const userFolder = path.join(UPLOAD_DIR, userId.toString());
          if (fs.existsSync(userFolder)) {
            console.log(`🧹 Cleaning up previous temporary files for user ${userId}`);

            // Remove all temp files in user folder
            const files = fs.readdirSync(userFolder);
            files.forEach(file => {
              if (file.startsWith('temp_') && !file.includes('merged_court_document')) {
                const filePath = path.join(userFolder, file);
                try {
                  fs.unlinkSync(filePath);
                  console.log(`  ✅ Deleted previous temp file: ${file}`);
                } catch (error) {
                  console.error(`  ❌ Failed to delete ${file}:`, error.message);
                }
              }
            });

            // Clean up temp documents folder
            const tempDocsFolder = path.join(userFolder, 'temp_documents');
            if (fs.existsSync(tempDocsFolder)) {
              console.log(`  🗑️ Deleting entire temp_documents directory: ${tempDocsFolder}`);
              fs.rmSync(tempDocsFolder, { recursive: true, force: true });
              console.log(`  ✅ Successfully deleted temp_documents directory`);
            }
          }
        } catch (cleanupError) {
          console.error('❌ Error cleaning up previous temp files:', cleanupError);
          // Don't throw error, continue with new upload
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
      console.log('💾 Saving application data to database...');
      const saved = await userService.saveApplication(user_data, case_data, payment_data);
      if (!saved.success) throw new Error('Failed to save application data');

      const userId = saved.user?.id;
      if (!userId) throw new Error('User ID not found after saving');

      console.log(`✅ Application data saved for user ID: ${userId}`);

      // 6. Clean up previous temporary files BEFORE processing new ones
      cleanupPreviousTempFiles(userId);

      // 7. Handle file uploads (temporary storage for merging)
      console.log(`📁 Using UPLOAD_DIR: ${UPLOAD_DIR}`);
      const userFolder = path.join(UPLOAD_DIR, userId.toString());
      console.log(`📂 Creating user folder: ${userFolder}`);
      ensureDirExists(userFolder);

      const filesToMerge = [];
      const exhibitDocuments = {
        'Exhibit A': [],
        'Exhibit B': [],
        'Exhibit C': [],
        'Exhibit D': [],
      };

      // Track processed files to avoid duplicates in the same request
      const processedFileHashes = new Set();

      // Function to delete duplicate file immediately
      const deleteDuplicateFile = (file, reason = 'duplicate') => {
        try {
          if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`  🗑️ Successfully deleted ${reason} file: ${file.originalname}`);
            return true;
          } else if (file && file.path) {
            console.log(`  ⚠️ ${reason} file already deleted or not found: ${file.originalname}`);
          }
        } catch (deleteError) {
          console.error(`  ❌ Failed to delete ${reason} file ${file?.path}:`, deleteError.message);
        }
        return false;
      };

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

          console.log('📄 Processing application form:', applicationFormFile.originalname);

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `temp_application_${userId}_${timestamp}.pdf`;
          const filePath = path.join(userFolder, filename);

          console.log(`💾 Temporarily saving application form to: ${filePath}`);
          fs.renameSync(applicationFormFile.path, filePath);
          storedFiles.push(filePath);

          // Store application PDF buffer for court document
          applicationPdfBuffer = fs.readFileSync(filePath);

          // Add to merge queue
          filesToMerge.push({
            filePath,
            type: 'application_form',
            originalName: applicationFormFile.originalname,
            uploadedAt: new Date(),
          });
        } else {
          console.log('🔄 Skipping and deleting duplicate application form file');
          deleteDuplicateFile(applicationFormFile, 'duplicate application form');
        }
      } else {
        console.log('⚠️ No application form file received');
      }

      // 7B. Handle exhibit documents with comprehensive duplicate detection
      if (req.files && req.files.documents) {
        const documentFiles = req.files.documents;
        console.log(`📚 Processing ${documentFiles.length} document files`);

        // Parse document metadata
        const documentMetadata = req.body.documentMetadata
          ? Array.isArray(req.body.documentMetadata)
            ? req.body.documentMetadata.map(meta => JSON.parse(meta))
            : [JSON.parse(req.body.documentMetadata)]
          : [];

        console.log(`📋 Found ${documentMetadata.length} metadata entries`);

        const documentsFolder = path.join(userFolder, 'temp_documents');
        ensureDirExists(documentsFolder);

        let validFileCount = 0;
        let duplicateCount = 0;

        for (let i = 0; i < documentFiles.length; i++) {
          const file = documentFiles[i];
          const meta = documentMetadata[i] || {};

          // Create unique hash for this file to avoid duplicates
          const fileHash = createFileHash(file, meta.exhibit);

          if (processedFileHashes.has(fileHash)) {
            console.log(`  🔄 Skipping duplicate file ${i + 1}: ${file.originalname} for exhibit ${meta.exhibit}`);
            deleteDuplicateFile(file, 'duplicate exhibit');
            duplicateCount++;
            continue;
          }
          processedFileHashes.add(fileHash);

          console.log(`  📄 Processing document ${i + 1}: ${file.originalname} for exhibit: ${meta.exhibit}`);

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filename = `temp_doc_${meta.exhibit}_${timestamp}_${safeFileName}`;
          const filePath = path.join(documentsFolder, filename);

          // Move file from multer temp location to our temp location
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

          // Add PDF files to merge queue
          if (file.mimetype === 'application/pdf') {
            filesToMerge.push({
              filePath,
              type: 'exhibit',
              exhibit: meta.exhibit,
              originalName: meta.originalName || file.originalname,
              uploadedAt: new Date(),
            });
          }

          console.log(`  ✅ Temporarily saved to: ${filename}`);
        }

        console.log(`📊 Document processing summary: ${validFileCount} valid files, ${duplicateCount} duplicates skipped`);

        // Clean up empty temp_documents folder if no files were saved
        if (validFileCount === 0 && fs.existsSync(documentsFolder)) {
          try {
            fs.rmdirSync(documentsFolder);
            console.log('🧹 Removed empty temp_documents folder');
          } catch (error) {
            // Ignore if not empty
          }
        }
      } else {
        console.log('⚠️ No document files received');
      }

      // 8. Generate Court Document (temporary - will be merged)
      console.log('⚖️ Generating court document...');
      let courtDocumentBuffer;
      let courtDocPath = null;

      try {
        courtDocumentBuffer = await courtPdfService.generateCourtDocument(
          user_data,
          case_data,
          applicationPdfBuffer,
          exhibitDocuments
        );

        const courtDocFilename = `temp_court_document_${userId}_${Date.now()}.pdf`;
        courtDocPath = path.join(userFolder, courtDocFilename);
        fs.writeFileSync(courtDocPath, courtDocumentBuffer);
        storedFiles.push(courtDocPath);

        console.log('✅ Court document generated and temporarily saved');

        // Add court document to merge queue
        if (courtDocPath) {
          filesToMerge.unshift({
            filePath: courtDocPath,
            type: 'court_document',
            originalName: 'Court Document.pdf',
            uploadedAt: new Date(),
          });
        }
      } catch (courtDocError) {
        console.error('❌ Court document generation failed:', courtDocError);
        // Generate simplified version as fallback
        try {
          courtDocumentBuffer = await courtPdfService.generateSimplifiedCourtDocument(user_data, case_data);
          const courtDocFilename = `temp_court_document_simple_${userId}_${Date.now()}.pdf`;
          courtDocPath = path.join(userFolder, courtDocFilename);
          fs.writeFileSync(courtDocPath, courtDocumentBuffer);
          storedFiles.push(courtDocPath);

          // Add to merge queue
          filesToMerge.unshift({
            filePath: courtDocPath,
            type: 'court_document',
            originalName: 'Court Document.pdf',
            uploadedAt: new Date(),
          });

          console.log('✅ Simplified court document generated as fallback');
        } catch (simpleError) {
          console.error('❌ Even simplified court document failed:', simpleError);
        }
      }

      // Capture user details for background email
      const userEmail = user_data.email;
      const userName = user_data.full_name;
      const isLoginUser = !!req.user_info?.id;

      // 9. Clear any existing merge queue for this user before starting new one
      const existingJob = pdfMergeService.getJobStatus(userId);
      if (existingJob) {
        console.log(`🧹 Clearing existing merge job for user ${userId}`);
        // Remove from queue to prevent duplicate processing
        pdfMergeService.mergeQueue.delete(userId);
      }

      // 10. Start background PDF merge job if we have PDFs
      if (filesToMerge.length > 0) {
        console.log(`🔄 Starting background PDF merge for ${filesToMerge.length} files`);

        // Add to merge queue
        await pdfMergeService.addToMergeQueue(userId, filesToMerge);

        // Start merge process in background
        setTimeout(async () => {
          try {
            console.log(`🎬 Starting background PDF merge for user ${userId}`);

            // Merge PDFs
            const mergeResult = await pdfMergeService.mergeUserPDFs(userId);
            console.log(`✅ Background PDF merge completed:`, mergeResult);

            if (mergeResult.success) {
              const saveResult = await userService.updateApplicationFilePath(userId, mergeResult.mergedFilePath, {
                applicationId: saved.case?.id,
                documentType: 'merged_court_document',
                fileName: path.basename(mergeResult.mergedFilePath),
                fileSize: mergeResult.fileSize,
                description: `Merged Court Document (${mergeResult.totalPages} pages from ${mergeResult.mergedFilesCount} files)`,
                updateUserRecord: true,
                totalPages: mergeResult.totalPages,
                mergedFilesCount: mergeResult.mergedFilesCount,
              });

              if (saveResult.success) {
                console.log(`💾 Merged PDF saved to database`);
              } else {
                console.error(`❌ Failed to save merged PDF:`, saveResult.error);
              }

              // Send email with the FINAL merged PDF
              try {
                const finalPdfBuffer = fs.readFileSync(mergeResult.mergedFilePath);

                // Determine registration link based on login status
                let registrationLink = null;
                if (!isLoginUser) {
                  registrationLink = `${FRONTEND_URL}/applicant/${userId}`;
                }

                console.log(`📧 Sending email to: ${userEmail}`);

                await sendApplicantRegEmail(userId, userName, userEmail, registrationLink, finalPdfBuffer);

                console.log('✅ Email sent with final merged PDF');
              } catch (emailError) {
                console.error('❌ Error sending email with final PDF:', emailError);
              }

              // ✅ Clean up ONLY temp_documents folder after successful merge and email
              setTimeout(async () => {
                try {
                  const cleanupResult = await pdfMergeService.cleanupTempDocuments(userId);
                  console.log(`🧹 temp_documents cleanup completed:`, cleanupResult);
                } catch (cleanupError) {
                  console.error(`❌ temp_documents cleanup failed:`, cleanupError);
                }
              }, 3000);
            }
          } catch (mergeError) {
            console.error(`❌ Background PDF merge failed for user ${userId}:`, mergeError);
          }
        }, 2000);
      } else {
        // If no files to merge, create a record for application without documents
        await userService.updateApplicationFilePath(userId, null, {
          applicationId: saved.case?.id,
          documentType: 'application_pdf',
          fileName: 'Application_Without_Documents.pdf',
          fileSize: 0,
          description: 'Application submitted without documents',
          updateUserRecord: true,
        });
      }

      // 11. Return success response immediately (don't wait for background jobs)
      const result = {
        message: '✅ Application saved successfully! PDF merging in progress...',
        data: {
          ...saved,
          mergeQueued: filesToMerge.length > 0,
          mergeFileCount: filesToMerge.length,
        },
        userId,
      };

      console.log(`🎉 Application process completed for user ${userId}`);
      return res.status(200).json(result);
    } catch (error) {
      console.error('❌ Error saving application:', error);

      // Enhanced cleanup that also checks for any orphaned multer files
      const cleanupAllFiles = () => {
        // Clean up stored temporary files
        if (storedFiles.length > 0) {
          console.log('🧹 Cleaning up stored temporary files due to error...');
          storedFiles.forEach(filePath => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Deleted stored temporary: ${filePath}`);
              }
            } catch (cleanupError) {
              console.error('❌ Error cleaning up stored file:', cleanupError);
            }
          });
        }

        // Clean up any remaining multer files that weren't processed
        if (req.files) {
          console.log('🧹 Cleaning up orphaned multer files due to error...');
          Object.values(req.files)
            .flat()
            .forEach(file => {
              try {
                if (file.path && fs.existsSync(file.path)) {
                  fs.unlinkSync(file.path);
                  console.log(`✅ Deleted orphaned multer file: ${file.originalname}`);
                }
              } catch (cleanupError) {
                console.error('❌ Error cleaning up multer file:', cleanupError);
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
      console.error('Error getting merged PDF:', error);
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
      console.error('Error checking merge status:', error);
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
      console.error('Error triggering merge:', error);
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
      console.error('Error triggering cleanup:', error);
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
      console.error('Error generating court document:', error);
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
      console.error('Error in testEnv:', error);
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
        console.log(`🧹 Manual cleanup for user ${userId}`);

        // Delete all files in user folder except merged court documents
        const files = fs.readdirSync(userFolder);
        files.forEach(file => {
          try {
            const filePath = path.join(userFolder, file);
            if (fs.statSync(filePath).isFile() && !file.includes('merged_court_document')) {
              fs.unlinkSync(filePath);
              deletedCount++;
              console.log(`  ✅ Deleted: ${file}`);
            }
          } catch (error) {
            errorCount++;
            console.error(`  ❌ Failed to delete ${file}:`, error.message);
          }
        });

        // ✅ OPTIMIZED: Delete entire temp_documents directory at once
        const tempDocsFolder = path.join(userFolder, 'temp_documents');
        if (fs.existsSync(tempDocsFolder)) {
          console.log(`  🗑️ Deleting entire temp_documents directory`);
          fs.rmSync(tempDocsFolder, { recursive: true, force: true });
          console.log(`  ✅ Successfully deleted temp_documents directory`);
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
      console.error('Error in manual cleanup:', error);
      return res.status(500).json({ error: error.message });
    }
  },
};
