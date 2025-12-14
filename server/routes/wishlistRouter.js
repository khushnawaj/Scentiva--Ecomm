const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const {
  getWishlist,
  toggleWishlistItem,
  removeWishlistItem,
} = require("../controllers/wishlistController");

// must be logged in
router.get("/", protect, getWishlist);
router.post("/", protect, toggleWishlistItem);
router.delete("/:productId", protect, removeWishlistItem);

module.exports = router;
