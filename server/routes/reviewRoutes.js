const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middlewares/authMiddleware");

const {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
} = require("../controllers/reviewController");

//  Create review (verified purchase only)
router.post("/", protect, createReview);

// Public: get reviews for a product
router.get("/product/:productId", getProductReviews);

//  Admin: get all reviews
router.get("/", protect, admin, getAllReviewsAdmin);

module.exports = router;
