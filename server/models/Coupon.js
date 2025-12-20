const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
    },

    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },

    // 0 = no cap
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    expiresAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    /* -------------------- FUTURE-READY (unused for now) -------------------- */
    // usageLimit: { type: Number, min: 1 },
    // usedCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
