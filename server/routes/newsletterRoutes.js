// server/routes/newsletterRoutes.js
const express = require("express");
const router = express.Router();

const {
  subscribeNewsletter,
  getSubscribers,
  deleteSubscriber,
} = require("../controllers/newsletterController");

const { protect, admin } = require("../middlewares/authMiddleware");

// ✅ import generic validate middleware
const validate = require("../middlewares/validateMiddleware");
// ✅ import Zod schema
const { newsletterSubscribeSchema } = require("../validators/newsletterValidators");

// Public: subscribe
// POST /api/newsletter/subscribe
router.post(
  "/subscribe",
  validate(newsletterSubscribeSchema),
  subscribeNewsletter
);

// Admin only: list subscribers
// GET /api/newsletter
router.get("/", protect, admin, getSubscribers);

// Admin only: delete subscriber
// DELETE /api/newsletter/:id
router.delete("/:id", protect, admin, deleteSubscriber);

module.exports = router;
