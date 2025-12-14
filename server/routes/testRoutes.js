// server/routes/testRoutes.js
const express = require("express");
const router = express.Router();
const { sendEmail } = require("../utils/mailer");

router.get("/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: process.env.EMAIL_USER, // send to yourself first
      subject: "Test email from Scentiva backend",
      text: "If you see this, Nodemailer is working 🎉",
    });

    res.json({ message: "Test email sent" });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

module.exports = router;
