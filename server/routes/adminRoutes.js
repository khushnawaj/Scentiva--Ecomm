const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middlewares/authMiddleware");
const { getAdminDashboard } = require("../controllers/adminController");

router.get("/dashboard", protect, admin, getAdminDashboard);

module.exports = router;
