// server/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");

const {
  createRazorpayOrderFromCart,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

// validation middleware
// const validate = require("../middlewares/validateMiddleware");
// const {
//   createOrderSchema,
//   verifyPaymentSchema,
// } = require("../validators/paymentValidators");

// Create Razorpay Order (from user cart)
router.post(
  "/razorpay/create-from-cart",
  protect,
  createRazorpayOrderFromCart
);

// Verify Razorpay Payment
router.post(
  "/razorpay/verify",
  protect,
  verifyRazorpayPayment
);

module.exports = router;
