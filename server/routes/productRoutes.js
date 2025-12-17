// server/routes/productRoutes.js
const express = require("express");
const router = express.Router();

const upload = require("../middlewares/uploadMiddleware");
const { protect, admin } = require("../middlewares/authMiddleware");

// validators + middleware
const validate = require("../middlewares/validateMiddleware");
const parseNumbers = require("../middlewares/parseNumberFields");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validators/productValidators");

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getProducts,
  addReview,
} = require("../controllers/productController");

// GET all products (public)
router.get("/", getProducts);

// CREATE product (admin only)
router.post(
  "/",
  protect,
  admin,
  upload.array("images", 5),
parseNumbers(["price", "stock", "discountPrice"]),
  validate(createProductSchema),
  createProduct
);

// GET single product (public)
router.get("/:id", getProductById);

// UPDATE product (admin only)
router.put(
  "/:id",
  protect,
  admin,
  upload.array("images", 5),
  parseNumbers(["price", "stock"]),
  validate(updateProductSchema),
  updateProduct
);

// DELETE product (admin only)
router.delete("/:id", protect, admin, deleteProduct);

// ADD review (logged-in user)
router.post("/:id/reviews", protect, addReview);

module.exports = router;
