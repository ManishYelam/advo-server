const crypto = require('crypto');
const razorpay = require('../../Config/Setting/razorpay.config');

const Payment = {
  createOrder: async (amount, currency = 'INR', receiptId = 'receipt#1') => {
    const options = {
      amount: amount,
      currency,
      receipt: receiptId,
    };
    const order = await razorpay.orders.create(options);
    return order;
  },

  verifyPaymentSignature: (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET).update(sign.toString()).digest('hex');
    return expectedSign === razorpay_signature;
  },
};

module.exports = Payment;
