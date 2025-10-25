const express = require('express');
const validateAsync = require('../Middlewares/validateAsyncMiddleware');
const authMiddleware = require('../Middlewares/authorizationMiddleware');
const { createUserSchema, updateUserSchema } = require('../Middlewares/Joi_Validations/userSchema');
const userController = require('../Controllers/UserController');
const uploadPublicMiddleware = require('../Middlewares/uploadPublicMiddleware');

const userRouter = express.Router();
// User routes
userRouter
  .post('/email', userController.checkExistsEmail)
  .post('/', validateAsync(createUserSchema), userController.createUser)
  .post('/verify', userController.verifyCreateUser)
  .post('/resend-verification', userController.resendVerification)
  .get('/', authMiddleware, userController.getAllUsers)
  .post('/v2', authMiddleware, userController.getAllUsersV2)
  .get('/:id', userController.getUserById)
  // .put('/:id', authMiddleware, validateAsync(updateUserSchema), userController.updateUser)
  .put('/:id', userController.updateUser)
  .delete('/:id', authMiddleware, userController.deleteUser)
  .delete('/user_range/:start_id/to/:end_id', authMiddleware, userController.deleteUserRanges)
  .post('/save-application', uploadPublicMiddleware.uploadApplicationMiddleware, userController.saveApplication)
  .post('/update-application', uploadPublicMiddleware.uploadApplicationMiddleware, userController.updateApplication);

// Get merged PDF
// Get merged PDF
userRouter.get('/merged-pdf/:userId', userController.getMergedPdf);

// Test route for environment variables
userRouter.get('/test-env', userController.testEnv);

// Test route for uploads
userRouter.post('/test-upload', uploadPublicMiddleware.uploadApplicationMiddleware, (req, res) => {
  console.log('🧪 Test upload received:');
  console.log('📁 Files:', req.files);
  console.log('📝 Body keys:', Object.keys(req.body));

  return res.status(200).json({
    message: 'Upload test successful',
    files: req.files ? Object.keys(req.files) : [],
    body: Object.keys(req.body),
    fileCount: {
      applicationForm: req.files?.applicationForm?.length || 0,
      documents: req.files?.documents?.length || 0,
    },
  });
});

// Merge management routes
userRouter.get('/merge-status/:userId', userController.checkMergeStatus);
userRouter.post('/trigger-merge/:userId', userController.triggerMerge);
userRouter.post('/trigger-cleanup/:userId', userController.triggerCleanup);

// Manual cleanup endpoint
userRouter.delete('/cleanup-files/:userId', userController.cleanupUserFiles);

// Court document generation
userRouter.get('/generate-court-doc/:userId', userController.generateCourtDoc);

// Export both routers properly
module.exports = {
  userRouter,
};

// const maintenanceService = require('./services/maintenanceService');
// maintenanceService.start();
