const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    discountPercent: {
      type: Number,
      required: true, // e.g. 10 for 10%
      min: 1,
      max: 90,
    },
    maxDiscount: {
      type: Number,
      default: 0, // 0 = no cap
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
