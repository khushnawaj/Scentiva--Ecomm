const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String
}, { _id: false });

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, index: 'text' },
  description: { type: String },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: String },
  stock: { type: Number, default: 0 },
  sku: { type: String, trim: true, unique: true,
    sparse: true, },
  images: [imageSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
