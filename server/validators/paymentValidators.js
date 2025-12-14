const { z } = require("zod");

// For creating razorpay order from cart
const createOrderSchema = z.object({
  currency: z.string().optional(), // e.g., "INR"
});

// For verifying payment from frontend
const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(5, "Payment ID required"),
  razorpay_order_id: z.string().min(5, "Order ID required"),
  razorpay_signature: z.string().min(5, "Signature missing"),
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
};
