// server/controllers/wishlistController.js
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Product = require("../models/Product");

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "wishlist",
    "title price images stock"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user.wishlist || []);
});

// POST /api/wishlist
// Toggle add/remove product from wishlist (expects { productId } in body)
const toggleWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;      // ✅ from body

  if (!productId) {
    res.status(400);
    throw new Error("productId is required");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const exists = user.wishlist.some(
    (pId) => pId.toString() === productId.toString()
  );

  if (exists) {
    user.wishlist = user.wishlist.filter(
      (pId) => pId.toString() !== productId.toString()
    );
  } else {
    user.wishlist.push(productId);
  }

  await user.save();

  res.json({
    inWishlist: !exists,
    wishlist: user.wishlist,
  });
});

// DELETE /api/wishlist/:productId
const removeWishlistItem = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.wishlist = user.wishlist.filter(
    (pId) => pId.toString() !== productId.toString()
  );
  await user.save();

  res.json({ message: "Removed from wishlist" });
});

module.exports = {
  getWishlist,
  toggleWishlistItem,
  removeWishlistItem,
};
