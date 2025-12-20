const asyncHandler = require("express-async-handler");
const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

/* -------------------------------------------------------------------------- */
/*                                 ADMIN                                      */
/* -------------------------------------------------------------------------- */

// POST /api/coupons
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountPercent,
    maxDiscount,
    minOrderValue,
    expiresAt,
  } = req.body;

  const normalizedCode = code.toUpperCase();

  const existing = await Coupon.findOne({ code: normalizedCode });
  if (existing) {
    res.status(400);
    throw new Error("Coupon code already exists");
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    description,
    discountPercent,
    maxDiscount,
    minOrderValue,
    expiresAt,
  });

  res.status(201).json(coupon);
});

// GET /api/coupons
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

// PUT /api/coupons/:id
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }

  const {
    code,
    description,
    discountPercent,
    maxDiscount,
    minOrderValue,
    expiresAt,
    isActive,
  } = req.body;

  // Prevent duplicate code on update
  if (code) {
    const normalizedCode = code.toUpperCase();

    const existing = await Coupon.findOne({
      code: normalizedCode,
      _id: { $ne: coupon._id },
    });

    if (existing) {
      res.status(400);
      throw new Error("Coupon code already exists");
    }

    coupon.code = normalizedCode;
  }

  if (description !== undefined) coupon.description = description;
  if (discountPercent !== undefined)
    coupon.discountPercent = discountPercent;
  if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
  if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
  if (expiresAt !== undefined) coupon.expiresAt = expiresAt;
  if (isActive !== undefined) coupon.isActive = isActive;

  const updated = await coupon.save();
  res.json(updated);
});

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

/* -------------------------------------------------------------------------- */
/*                                  USER                                      */
/* -------------------------------------------------------------------------- */

// POST /api/coupons/apply
// Preview only (NO DB mutation)
const applyCouponToCart = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const normalizedCode = code.toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
    isActive: true,
  });

  if (!coupon) {
    res.status(400);
    throw new Error("Invalid or inactive coupon");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400);
    throw new Error("Coupon expired");
  }

  // Prevent reuse (preview-stage UX)
  const alreadyUsed = await Order.findOne({
    user: req.user._id,
    "coupon.code": coupon.code,
  });

  if (alreadyUsed) {
    res.status(400);
    throw new Error("Coupon already used");
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

  if (itemsPrice < coupon.minOrderValue) {
    res.status(400);
    throw new Error(
      `Minimum order value for this coupon is ₹${coupon.minOrderValue}`
    );
  }

  const taxPrice = +(itemsPrice * 0.05).toFixed(2);
  const shippingPrice = itemsPrice > 500 ? 0 : 50;
  const baseTotal = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

  let discount = (itemsPrice * coupon.discountPercent) / 100;

  if (coupon.maxDiscount > 0) {
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
// PUBLIC: list active coupons for users (read-only)
// GET /api/coupons/public
const getPublicCoupons = asyncHandler(async (req, res) => {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gte: now } },
    ],
  })
    .select("code description discountPercent minOrderValue expiresAt")
    .sort({ createdAt: -1 });

  res.json(coupons);
});


module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  applyCouponToCart,
  getPublicCoupons,
};
