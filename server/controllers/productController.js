// controllers/productController.js
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');


/**
 * Helper: build full URL for uploaded file
 */
// const buildFileUrl = (req, filename) => {
//   if (!req || !req.get) return `/uploads/${filename}`;
//   const protocol = req.protocol;
//   const host = req.get('host');
//   return `${protocol}://${host}/uploads/${filename}`;
// };

/**
 * Helper: safe unlink (synchronous, best-effort)
 */
// const safeUnlink = (filePath) => {
//   try {
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//   } catch (err) {
//     // intentionally swallow - log for debug
//     console.warn('safeUnlink error:', err.message);
//   }
// };

/**
 * POST /api/products
 * Create a product with uploaded images (expects 'images' field in FormData)
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    discountPrice,
    category,
    brand,
    stock,
    sku,          // ⭐ accept sku from body (optional)
  } = req.body;

  // files from multer (upload.array('images', ...))
  const files = req.files || [];

  // map files to objects - store full accessible URLs and filename for cleanup
  const images = files.map(file => ({
    url: file.path,
    public_id:file.filename
  }));

  // ⭐ Auto-generate SKU only if not provided
  let finalSku = (sku && sku.trim()) || "";

  if (!finalSku) {
    const count = await Product.countDocuments();
    const num = String(count + 1).padStart(4, "0"); // 0001, 0002, ...
    finalSku = `CND-${num}`;
  }

  const product = new Product({
    title,
    description,
    price,
    discountPrice,
    brand,
    category,
    stock,
    sku: finalSku,   // ⭐ save final sku (auto or custom)
    images
  });

  const created = await product.save();
  res.status(201).json(created);
});


/**
 * GET /api/products
 * Return list of products with search/filter/sort/pagination
 */
const getProducts = asyncHandler(async (req, res) => {
  let { page = 1, limit = 12, keyword = '', category, minPrice, maxPrice, sort } = req.query;
  page = Number(page) || 1;
  limit = Number(limit) || 12;

  const query = {};
  if (keyword) {
    // text index required on Product collection for $text to work (ensure in model)
    query.$text = { $search: keyword };
  }
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let cursor = Product.find(query).populate('category');

  // sort
  if (sort === 'newest') cursor = cursor.sort({ createdAt: -1 });
  else if (sort === 'priceAsc') cursor = cursor.sort({ price: 1 });
  else if (sort === 'priceDesc') cursor = cursor.sort({ price: -1 });
  else if (sort === 'rating') cursor = cursor.sort({ rating: -1 });

  const total = await Product.countDocuments(query);
  const products = await cursor.skip((page - 1) * limit).limit(limit);
  res.json({ products, page, pages: Math.ceil(total / limit) || 1, total });
});

/**
 * GET /api/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const product = await Product.findById(id)
    .populate('category', 'name slug') 
    .populate({
      path: 'reviews',
      populate: { path: 'user', select: 'name' }
    });

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json(product);
});


/**
 * PUT /api/products/:id
 * Update product details and optionally append newly uploaded images
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // apply basic updates
  const {
    title,
    description,
    price,
    discountPrice,
    brand,
    category,
    stock,
    sku,           // ⭐ accept sku here also
  } = req.body;

  if (typeof title !== 'undefined') product.title = title;
  if (typeof description !== 'undefined') product.description = description;
  if (typeof price !== 'undefined') product.price = price;
  if (typeof discountPrice !== 'undefined') product.discountPrice = discountPrice;
  if (typeof brand !== 'undefined') product.brand = brand;
  if (typeof category !== 'undefined') product.category = category;
  if (typeof stock !== 'undefined') product.stock = stock;

  // ⭐ If sku is explicitly provided (and non-empty), update it
  if (typeof sku !== 'undefined' && sku !== "") {
    product.sku = sku;
  }

  // If new files uploaded, append them to existing images
  if (req.files && req.files.length) {

    const newImages = req.files.map(file => ({
      url: file.path,
     public_id:file.filename
    }));

    product.images = Array.isArray(product.images)
      ? [...product.images, ...newImages]
      : newImages;
  }

  const saved = await product.save();
  res.json(saved);
});


/**
 * DELETE /api/products/:id
 * Remove product and unlink files from disk (if any)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // unlink files from disk (best effort)
  // if (product.images && Array.isArray(product.images)) {
  //   for (const img of product.images) {
  //     try {
  //       // prefer filename if saved, otherwise derive from URL
  //       const filename = img.filename || path.basename(img.url || '');
  //       if (!filename) continue;
  //       const filePath = path.join(__dirname, '..', 'uploads', filename);
  //       safeUnlink(filePath);
  //     } catch (err) {
  //       console.warn('Error unlinking file:', err.message);
  //     }
  //   }
  // }
  if (product.images?.length) {
  for (const img of product.images) {
    if (img.public_id) {
      await cloudinary.uploader.destroy(img.public_id);
    }
  }
}
await product.deleteOne();
  res.json({ message: 'Product removed' });
});

/**
 * POST /api/products/:id/reviews
 * Add review for a product (assumes req.user exists from auth middleware)
 */
const addReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error('Invalid product id');
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const userId = req.user && req.user._id;
  if (!userId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const { rating, comment } = req.body;
  if (!rating) {
    res.status(400);
    throw new Error('Rating is required');
  }

  // check if user already reviewed this product
  const existing = await Review.findOne({ user: userId, product: product._id });
  if (existing) {
    res.status(400);
    throw new Error('Product already reviewed by this user');
  }

  const review = new Review({
    user: userId,
    product: product._id,
    rating: Number(rating),
    comment: comment || ''
  });
  await review.save();

  product.reviews.push(review._id);
  // update numReviews and rating by fetching reviews to avoid rounding errors
  const reviews = await Review.find({ product: product._id });
  product.numReviews = reviews.length;
  const totalRating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  product.rating = reviews.length ? totalRating / reviews.length : 0;

  await product.save();

  res.status(201).json({ message: 'Review added' });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addReview
};
