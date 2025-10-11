const Payment = require("../Services/paymentService");

module.exports = {
    createOrderController: async (req, res) => {
        try {
            const { amount, receiptId } = req.body;
            const order = await Payment.createOrder(amount, "INR", receiptId);
            res.status(200).json({ success: true, order });
        } catch (err) {
            console.error("Error creating order:", err);
            res.status(500).json({ success: false, message: "Unable to create order" });
        }
    },

    verifyPaymentController: async (req, res) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
            const isValid = Payment.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            if (isValid) {
                res.status(200).json({ success: true, message: "Payment verified successfully" });
            } else {
                res.status(400).json({ success: false, message: "Invalid signature" });
            }
        } catch (err) {
            console.error("Verification error:", err);
            res.status(500).json({ success: false, message: "Verification failed" });
        }
    }
}
