const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// GET /api/cart  - get cart for user
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if(!cart) cart = { user: req.user._id, items: [] };
  res.json(cart);
});

// POST /api/cart  - add/update item
// POST /api/cart - add/update item
const addToCart = asyncHandler(async (req, res) => {
  const { productId, qty } = req.body;
  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  
  const idx = cart.items.findIndex(i => i.product.toString() === productId);
  if (idx > -1) {
    cart.items[idx].qty = qty;
    cart.items[idx].price = product.price;
  } else {
    cart.items.push({ product: productId, qty, price: product.price });
  }
  
  await cart.save();
  
  // ✅ FIX: Re-fetch and populate the cart before sending the response
  // This guarantees the frontend receives the full 'product' object.
  const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  res.json(populatedCart);
});


// DELETE /api/cart/:productId - remove item
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }
  
  cart.items = cart.items.filter(i => i.product.toString() !== productId);
  
  await cart.save();
  
  // ✅ FIX: Re-fetch and populate the cart before sending the response
  const populatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  res.json(populatedCart);
});

module.exports = { getCart, addToCart, removeFromCart };
