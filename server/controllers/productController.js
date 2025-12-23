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

page = Math.max(1, parseInt(page, 10) || 1);
limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));


  const query = {};

if (keyword) {
  query.$or = [
    { title: { $regex: keyword, $options: "i" } },
    { description: { $regex: keyword, $options: "i" } },
  ];
}
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
  const totalPages = Math.ceil(total / limit) || 1;
const skip = (page - 1) * limit;

const products = await cursor
  .skip(skip >= total ? 0 : skip)
  .limit(limit);


  res.json({
    products,
    page,
    pages: totalPages,
    totalPages: totalPages,
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
    .populate("category", "name slug");

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
  const userId = req.user._id;
  const { rating, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  if (!rating) {
    res.status(400);
    throw new Error("Rating is required");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // prevent duplicate review
  const existing = await Review.findOne({
    user: userId,
    product: id,
  });

  if (existing) {
    res.status(400);
    throw new Error("Product already reviewed");
  }

  // create review
  await Review.create({
    user: userId,
    product: id,
    rating: Number(rating),
    comment: comment || "",
  });

  // ⭐ update aggregation
  const newCount = product.ratingsCount + 1;
  const newAverage =
    (product.averageRating * product.ratingsCount + Number(rating)) /
    newCount;

  product.ratingsCount = newCount;
  product.averageRating = Number(newAverage.toFixed(1));

  await product.save();

  res.status(201).json({ message: "Review added successfully" });
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
