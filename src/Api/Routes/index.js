const express = require('express');
const authMiddleware = require('../Middlewares/authorizationMiddleware');
const authRouter = require('./authRoutes');
const applicationRouter = require('./applicationPropertiesRoutes');
const { userRouter } = require('./userRoutes');
const genericRouter = require('./GenericRoutes');
const fileRouter = require('./fileRoutes');
const { caseRouter } = require('./caseRoutes');

const router = express.Router();

router
  .use('/', authRouter)
  .use('/users', userRouter)
  .use('/application', authMiddleware, applicationRouter)
  .use('/generics', authMiddleware, genericRouter)
  .use('/files', authMiddleware, fileRouter)
  .use('/case', authMiddleware, caseRouter);

module.exports = router;
