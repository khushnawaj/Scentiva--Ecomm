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
const cloudinary = require("../config/cloudinary");


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
  upload.single("avatar"),
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

    // 🔥 Delete old avatar from Cloudinary (if exists)
    if (user.avatar?.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    // ✅ Save new avatar
    user.avatar = {
      url: req.file.path,          // Cloudinary secure URL
      public_id: req.file.filename // Cloudinary public_id
    };

    await user.save();

    res.json({
      message: "Avatar updated successfully",
      avatar: user.avatar.url
    });
  })
);


module.exports = router;
