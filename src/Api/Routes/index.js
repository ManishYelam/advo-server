const express = require('express');
const authMiddleware = require('../Middlewares/authorizationMiddleware');
const authRouter = require('./authRoutes');
const applicationRouter = require('./applicationPropertiesRoutes');
const { userRouter } = require('./userRoutes');
const genericRouter = require('./GenericRoutes');
const fileRouter = require('./fileRoutes');
const { caseRouter } = require('./caseRoutes');
const contactRouter = require('./contactRoutes');
const paymentRouter = require('./paymentRoutes');
const supportRouter = require('./supportRoutes');
const feedbackRouter = require('./feedbackRoutes');

const router = express.Router();

router
  .use('/', authRouter)
  .use('/users', userRouter)
  .use('/application', authMiddleware, applicationRouter)
  .use('/generics', authMiddleware, genericRouter)
  .use('/files', authMiddleware, fileRouter)
  .use('/contact', contactRouter)
  .use('/payment', paymentRouter)
  .use('/case', authMiddleware, caseRouter)
  .use('/support', supportRouter)
  .use('/feedback', feedbackRouter);

module.exports = router;
