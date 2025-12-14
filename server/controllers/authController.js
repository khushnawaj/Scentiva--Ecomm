const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const { sendEmail } = require("../utils/mailer");

// -----------------------------------------
// REGISTER USER
// -----------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password });

  if (user) {
    // Send welcome email (non-blocking)
    (async () => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Welcome to Scentiva ✨",
          html: `
            <div style="font-family: system-ui, sans-serif; line-height:1.6;">
              <h2 style="color:#8B5E3C;">Hi ${user.name || "there"} 🕯️</h2>
              <p>Thanks for joining <strong>Scentiva</strong>.</p>
              <p>You can now shop, track orders, save your cart and more.</p>
              <p style="margin-top: 12px;">Love & Light,<br/>Scentiva Team</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("Welcome email error:", err.message);
      }
    })();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// -----------------------------------------
// LOGIN USER
// -----------------------------------------
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Send login alert email (non-blocking)
    (async () => {
      try {
        await sendEmail({
          to: user.email,
          subject: "New login to your Scentiva account",
          html: `
            <div style="font-family: system-ui, sans-serif; line-height:1.6;">
              <p>Hi ${user.name || "there"},</p>
              <p>A new login occurred on your <strong>Scentiva</strong> account.</p>
              <p>If this was you, ignore this email. If not, reset your password immediately.</p>
              <p style="margin-top: 12px;">Stay safe,<br/>Scentiva Security</p>
            </div>
          `,
        });
      } catch (err) {
        console.error("Login email error:", err.message);
      }
    })();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// -----------------------------------------
// FORGOT PASSWORD (demo, sends email)
// -----------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("No user with that email");
  }

  const resetToken = crypto.randomBytes(20).toString("hex");

  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Scentiva password reset request",
      html: `
        <div style="font-family: system-ui, sans-serif; line-height:1.6;">
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password.</p>
          <p>This is a <strong>DEMO MODE</strong> token:</p>
          <p style="font-family: monospace; background:#f4f4f4; padding:10px; border-radius:4px;">
            ${resetToken}
          </p>
          <p>In a real app, you'd verify the token in database.</p>
          <p style="margin-top:12px;">If this wasn't you, ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Forgot password email error:", err.message);
  }

  res.json({
    message: "Reset token generated (demo). Sent to email.",
    resetToken,
  });
});

// -----------------------------------------
// GET PROFILE
// -----------------------------------------
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
});

// -----------------------------------------
// UPDATE PROFILE
// -----------------------------------------
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) user.password = req.body.password;
    if (req.body.addresses) user.addresses = req.body.addresses;
    if (req.body.avatar) user.avatar = req.body.avatar;

    const updated = await user.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar,
      token: generateToken(updated),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// -----------------------------------------
// CHANGE PASSWORD
// -----------------------------------------
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Both current and new password are required");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isMatch = await user.matchPassword(oldPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

module.exports = {
  registerUser,
  authUser,
  forgotPassword,
  getProfile,
  updateProfile,
  changePassword,
};
