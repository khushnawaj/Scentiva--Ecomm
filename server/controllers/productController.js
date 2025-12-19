const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Review = require("../models/Review");
const cloudinary = require("../config/cloudinary");

/* -------------------------------------------------------------------------- */
/*                               HELPER UTILS                                 */
/* -------------------------------------------------------------------------- */

// Safe JSON parse for multipart/form-data
const safeParse = (val, fallback = []) => {
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

/* -------------------------------------------------------------------------- */
/*                               CREATE PRODUCT                               */
/* -------------------------------------------------------------------------- */
/**
 * POST /api/products
 * Create a product with uploaded images
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
    sku,
  } = req.body;

  const files = req.files || [];

  const images = files.map((file) => ({
    url: file.path, // Cloudinary secure_url
    public_id: file.filename,
  }));

  // Auto-generate SKU if not provided
  let finalSku = (sku && sku.trim()) || "";
  if (!finalSku) {
    const count = await Product.countDocuments();
    finalSku = `CND-${String(count + 1).padStart(4, "0")}`;
  }

  const product = new Product({
    title,
    description,
    price,
    discountPrice,
    brand,
    category,
    stock,
    sku: finalSku,
    images,
  });

  const created = await product.save();
  res.status(201).json(created);
});

/* -------------------------------------------------------------------------- */
/*                                GET PRODUCTS                                */
/* -------------------------------------------------------------------------- */
/**
 * GET /api/products
 */
const getProducts = asyncHandler(async (req, res) => {
  let { page = 1, limit = 12, keyword = "", category, minPrice, maxPrice, sort } =
    req.query;

  page = Number(page) || 1;
  limit = Number(limit) || 12;

  const query = {};

  if (keyword) query.$text = { $search: keyword };
  if (category) query.category = category;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let cursor = Product.find(query).populate("category");

  if (sort === "newest") cursor = cursor.sort({ createdAt: -1 });
  else if (sort === "priceAsc") cursor = cursor.sort({ price: 1 });
  else if (sort === "priceDesc") cursor = cursor.sort({ price: -1 });
  else if (sort === "rating") cursor = cursor.sort({ rating: -1 });

  const total = await Product.countDocuments(query);
  const products = await cursor
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

/* -------------------------------------------------------------------------- */
/*                              GET PRODUCT BY ID                             */
/* -------------------------------------------------------------------------- */
/**
 * GET /api/products/:id
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id)
    .populate("category", "name slug")
    .populate({
      path: "reviews",
      populate: { path: "user", select: "name" },
    });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json(product);
});

/* -------------------------------------------------------------------------- */
/*                               UPDATE PRODUCT                               */
/* -------------------------------------------------------------------------- */
/**
 * PUT /api/products/:id
 * Update product + full image lifecycle handling
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  /* ----------------------------- BASIC FIELDS ----------------------------- */
  const {
    title,
    description,
    price,
    discountPrice,
    brand,
    category,
    stock,
    sku,
  } = req.body;

  if (title !== undefined) product.title = title;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (discountPrice !== undefined) product.discountPrice = discountPrice;
  if (brand !== undefined) product.brand = brand;
  if (category !== undefined) product.category = category;
  if (stock !== undefined) product.stock = stock;
  if (sku !== undefined && sku !== "") product.sku = sku;

  /* --------------------------- IMAGE LIFECYCLE ---------------------------- */
  const existingImages = safeParse(req.body.existingImages);
  const removedImages = safeParse(req.body.removedImages);

  // product-owned image ids
  const productImageIds = new Set(
    product.images.map((img) => img.public_id)
  );

  // delete removed images (only if they belong to product)
  for (const img of removedImages) {
    if (img.public_id && productImageIds.has(img.public_id)) {
      await cloudinary.uploader.destroy(img.public_id, {
        resource_type: "image",
        invalidate: true,
      });
    }
  }

  // upload new images
  const newImages = (req.files || []).map((file) => ({
    url: file.path,
    public_id: file.filename,
  }));

  // keep only valid existing images
  const existingImageIds = new Set(
    existingImages.map((img) => img.public_id)
  );

  const safeExistingImages = product.images.filter((img) =>
    existingImageIds.has(img.public_id)
  );

  // final merge
  product.images = [...safeExistingImages, ...newImages];

  const saved = await product.save();
  res.json(saved);
});

/* -------------------------------------------------------------------------- */
/*                               DELETE PRODUCT                               */
/* -------------------------------------------------------------------------- */
/**
 * DELETE /api/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // delete all Cloudinary images
  if (product.images?.length) {
    for (const img of product.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id, {
          resource_type: "image",
          invalidate: true,
        });
      }
    }
  }

  await product.deleteOne();
  res.json({ message: "Product removed" });
});

/* -------------------------------------------------------------------------- */
/*                                ADD REVIEW                                  */
/* -------------------------------------------------------------------------- */
/**
 * POST /api/products/:id/reviews
 */
const addReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const userId = req.user?._id;
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required");
  }

  const { rating, comment } = req.body;
  if (!rating) {
    res.status(400);
    throw new Error("Rating is required");
  }

  const existing = await Review.findOne({
    user: userId,
    product: product._id,
  });

  if (existing) {
    res.status(400);
    throw new Error("Product already reviewed by this user");
  }

  const review = new Review({
    user: userId,
    product: product._id,
    rating: Number(rating),
    comment: comment || "",
  });

  await review.save();

  product.reviews.push(review._id);

  const reviews = await Review.find({ product: product._id });
  product.numReviews = reviews.length;
  product.rating =
    reviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
      reviews.length || 0;

  await product.save();

  res.status(201).json({ message: "Review added" });
});

/* -------------------------------------------------------------------------- */
/*                                   EXPORTS                                  */
/* -------------------------------------------------------------------------- */
module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addReview,
};
