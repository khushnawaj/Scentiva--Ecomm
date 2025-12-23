const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");

/* -------------------------------------------------------------------------- */
/*                               CREATE REVIEW                                 */
/* -------------------------------------------------------------------------- */
// @desc    Create review (verified purchase only)
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { orderId, productId, rating, comment } = req.body;

  /* ---------------------------- BASIC VALIDATION --------------------------- */
  if (!userId) {
    res.status(401);
    throw new Error("Authentication required");
  }

  if (!orderId || !productId || rating === undefined) {
    res.status(400);
    throw new Error("orderId, productId and rating are required");
  }

  if (
    !mongoose.Types.ObjectId.isValid(orderId) ||
    !mongoose.Types.ObjectId.isValid(productId)
  ) {
    res.status(400);
    throw new Error("Invalid orderId or productId");
  }

  const numericRating = Number(rating);
  if (numericRating < 1 || numericRating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  /* ------------------------------ FETCH ORDER ------------------------------ */
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  /* ------------------------------ OWNERSHIP -------------------------------- */
  if (order.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error("Not authorized to review this order");
  }

  /* --------------------------- DELIVERY CHECK ------------------------------ */
  if (order.status !== "delivered") {
    res.status(400);
    throw new Error("You can review only after delivery");
  }

  /* ------------------------ PRODUCT IN ORDER -------------------------------- */
  const item = order.orderItems.find(
    (i) => i.product.toString() === productId
  );

  if (!item) {
    res.status(400);
    throw new Error("Product not found in this order");
  }

  /* ------------------------- DUPLICATE PREVENTION -------------------------- */
  const alreadyReviewed = await Review.findOne({
    user: userId,
    product: productId,
    order: orderId,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error("Product already reviewed");
  }

  /* ------------------------------ CREATE REVIEW ---------------------------- */
  await Review.create({
    user: userId,
    product: productId,
    order: orderId,
    rating: numericRating,
    comment: comment?.trim() || "",
  });

  /* ------------------------- UPDATE PRODUCT STATS -------------------------- */
  const product = await Product.findById(productId);
  if (product) {
    const newCount = product.ratingsCount + 1;

    const newAverage =
      (product.averageRating * product.ratingsCount + numericRating) /
      newCount;

    product.ratingsCount = newCount;
    product.averageRating = Number(newAverage.toFixed(1));

    await product.save();
  }

  res.status(201).json({ message: "Review submitted successfully" });
});

/* -------------------------------------------------------------------------- */
/*                          GET PRODUCT REVIEWS                                */
/* -------------------------------------------------------------------------- */
// @desc    Get reviews of a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const reviews = await Review.find({ product: productId })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

/* -------------------------------------------------------------------------- */
/*                            ADMIN: ALL REVIEWS                               */
/* -------------------------------------------------------------------------- */
// @desc    Get all reviews (admin)
// @route   GET /api/reviews
// @access  Admin
const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("user", "name")
    .populate("product", "title")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

module.exports = {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
};
