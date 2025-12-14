// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");

const {
  registerUser,
  authUser,
  forgotPassword,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const User = require("../models/User");

// ✅ validation imports
const validate = require("../middlewares/validateMiddleware");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
} = require("../validators/authValidators");

// AUTH
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), authUser);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword
);

// PROFILE
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// AVATAR UPLOAD
router.post(
  "/avatar",
  protect,
  upload.single("avatar"), // expects field name "avatar"
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // file saved as "uploads/<filename>"
    const avatarPath = `/uploads/${req.file.filename}`;
    user.avatar = avatarPath;
    await user.save();

    res.json({ avatar: avatarPath });
  })
);

module.exports = router;
