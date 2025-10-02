const express = require('express');
const AuthController = require('../Controllers/AuthController');
const authMiddleware = require('../Middlewares/authorizationMiddleware');
const validate = require('../Middlewares/validateMiddleware');
const { loginSchema, changePasswordSchema, resetPasswordSchema } = require('../Middlewares/Joi_Validations/authSchema');

const authRouter = express.Router();
authRouter
  .post('/login', AuthController.login)
  .post('/logout', authMiddleware, AuthController.logout)
  .post('/change-password', validate(changePasswordSchema), authMiddleware, AuthController.changePassword)
  .post('/reset-password/:email', validate(resetPasswordSchema), AuthController.resetPassword)
  .post('/forget-password/:email', AuthController.forgetPassword)

  .get('/organization', AuthController.getOrganization)
  .post('/organization', authMiddleware, AuthController.upsertOrganization);

module.exports = authRouter;
