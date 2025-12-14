const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const Review = require('../models/Review');
const asyncHandler = require('express-async-handler');

router.get('/', asyncHandler(async (req, res) => {
  const reviews = await Review.find().populate('user', 'name').populate('product', 'title');
  res.json(reviews);
}));

module.exports = router;
