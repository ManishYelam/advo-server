const express = require('express');
const validateAsync = require('../Middlewares/validateAsyncMiddleware');
const authMiddleware = require('../Middlewares/authorizationMiddleware');
const { createUserSchema, updateUserSchema } = require('../Middlewares/Joi_Validations/userSchema');
const userController = require('../Controllers/UserController');
const uploadPublicMiddleware = require('../Middlewares/uploadPublicMiddleware');

const userRouter = express.Router();
// User routes
userRouter
  .post('/email',  userController.checkExistsEmail)
  .post('/', validateAsync(createUserSchema), userController.createUser)
  .get('/verify', userController.verifyCreateUser)
  .get('/', authMiddleware, userController.getAllUsers)
  .post('/v2', authMiddleware, userController.getAllUsersV2)
  .get('/:id', userController.getUserById)
  // .put('/:id', authMiddleware, validateAsync(updateUserSchema), userController.updateUser)
  .put('/:id', userController.updateUser)
  .delete('/:id', authMiddleware, userController.deleteUser)
  .delete('/user_range/:start_id/to/:end_id', authMiddleware, userController.deleteUserRanges)
  .post('/save-application', userController.saveApplication);

// Export both routers properly
module.exports = {
  userRouter,
};
