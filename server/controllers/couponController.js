const asyncHandler = require("express-async-handler");
const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");

// ADMIN: create coupon
// POST /api/coupons
const createCoupon = asyncHandler(async (req, res) => {
  const { code, description, discountPercent, maxDiscount, minOrderValue, expiresAt } =
    req.body;

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    res.status(400);
    throw new Error("Coupon code already exists");
  }

  const coupon = await Coupon.create({
    code,
    description,
    discountPercent,
    maxDiscount,
    minOrderValue,
    expiresAt,
  });

  res.status(201).json(coupon);
});

// ADMIN: get all coupons
// GET /api/coupons
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

// ADMIN: update coupon
// PUT /api/coupons/:id
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }

  const { code, description, discountPercent, maxDiscount, minOrderValue, expiresAt, isActive } =
    req.body;

  if (code) coupon.code = code;
  if (description !== undefined) coupon.description = description;
  if (discountPercent !== undefined) coupon.discountPercent = discountPercent;
  if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
  if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
  if (expiresAt !== undefined) coupon.expiresAt = expiresAt;
  if (isActive !== undefined) coupon.isActive = isActive;

  const updated = await coupon.save();
  res.json(updated);
});

// ADMIN: delete coupon
// DELETE /api/coupons/:id
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  await coupon.deleteOne();
  res.json({ message: "Coupon deleted" });
});

// USER: apply coupon to current cart (no DB mutation yet)
// POST /api/coupons/apply { code }
const applyCouponToCart = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon || !coupon.isActive) {
    res.status(400);
    throw new Error("Invalid or inactive coupon");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400);
    throw new Error("Coupon expired");
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  if (!cart || !cart.items.length) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  const itemsPrice = cart.items.reduce(
    (acc, it) => acc + it.product.price * it.qty,
    0
  );
  const taxPrice = +(itemsPrice * 0.05).toFixed(2);
  const shippingPrice = itemsPrice > 500 ? 0 : 50;
  const baseTotal = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

  if (itemsPrice < coupon.minOrderValue) {
    res.status(400);
    throw new Error(
      `Minimum order value for this coupon is ₹${coupon.minOrderValue}`
    );
  }

  let discount = (itemsPrice * coupon.discountPercent) / 100;
  if (coupon.maxDiscount && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  const totalAfterDiscount = Math.max(0, baseTotal - discount);

  res.json({
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    maxDiscount: coupon.maxDiscount,
    minOrderValue: coupon.minOrderValue,
    itemsPrice,
    taxPrice,
    shippingPrice,
    baseTotal,
    discount: +discount.toFixed(2),
    totalAfterDiscount: +totalAfterDiscount.toFixed(2),
  });
});

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  applyCouponToCart,
};
