const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');

router.get('/', asyncHandler(async (req, res) => {
  const cats = await Category.find();
  res.json(cats);
}));

router.post('/', protect, admin, asyncHandler(async (req, res) => {
  const { name, parentCategory } = req.body;
  const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
  const cat = new Category({ name, slug, parentCategory: parentCategory || null });
  await cat.save();
  res.status(201).json(cat);
}));

router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if(!cat) { res.status(404); throw new Error('Category not found'); }
  cat.name = req.body.name || cat.name;
  cat.slug = req.body.name ? req.body.name.trim().toLowerCase().replace(/\s+/g, '-') : cat.slug;
  cat.parentCategory = req.body.parentCategory || cat.parentCategory;
  await cat.save();
  res.json(cat);
}));

router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category removed' });
}));

module.exports = router;
