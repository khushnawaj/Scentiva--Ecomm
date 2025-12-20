const mongoose = require("mongoose");

/* -------------------------------------------------------------------------- */
/*                               Order Item                                   */
/* -------------------------------------------------------------------------- */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false }
);

/* -------------------------------------------------------------------------- */
/*                                   Order                                    */
/* -------------------------------------------------------------------------- */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
    },

    paymentMethod: {
      type: String,
      default: "dummy",
    },

    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },

    /* ------------------------------ Pricing -------------------------------- */
    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    /* ------------------------------ Coupon --------------------------------- */
    coupon: {
      code: {
        type: String,
        uppercase: true,
        trim: true,
      },
      discountPercent: Number,
      discountAmount: {
        type: Number,
        default: 0,
      },
    },

    // Internal reference (optional but powerful)
    appliedCoupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    /* ------------------------------- Status -------------------------------- */
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,

    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
