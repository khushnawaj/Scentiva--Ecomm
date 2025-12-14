const express = require("express");
const router = express.Router();

const { protect, admin } = require("../middlewares/authMiddleware");
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  applyCouponToCart,
} = require("../controllers/couponController");

// Admin
router.post("/", protect, admin, createCoupon);
router.get("/", protect, admin, getCoupons);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

// User apply coupon
router.post("/apply", protect, applyCouponToCart);

module.exports = router;
