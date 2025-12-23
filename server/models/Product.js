const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: String,
    public_id: String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: "text" },
    description: String,

    price: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    brand: String,

    stock: { type: Number, default: 0 },
    sku: { type: String, trim: true, unique: true, sparse: true },

    images: [imageSchema],

    // ⭐ RATING AGGREGATION (SOURCE OF TRUTH)
    averageRating: {
      type: Number,
      default: 0,
    },

    ratingsCount: {
      type: Number,
      default: 0,
    },

    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text", brand: "text" });

module.exports = mongoose.model("Product", productSchema);
