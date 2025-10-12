const express = require('express');
const { createOrderController, verifyPaymentController } = require('../controllers/paymentController');

const paymentRouter = express.Router();

paymentRouter
    .post('/create-order', createOrderController)
    .post('/verify-payment', verifyPaymentController);

module.exports = paymentRouter;
