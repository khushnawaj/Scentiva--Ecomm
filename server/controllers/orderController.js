const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

const {
  orderStatusUpdateTemplate,
  orderConfirmationTemplate,
} = require("../utils/orderEmailTemplates");
const { sendEmail } = require("../utils/mailer");




// POST /api/orders - create order from cart (COD / dummy)
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Cart empty");
  }

  /* -------------------------------------------------------------------------- */
  /*                              PRICE CALCULATION                             */
  /* -------------------------------------------------------------------------- */
  const itemsPrice = cart.items.reduce(
    (acc, it) => acc + it.product.price * it.qty,
    0
  );

  const taxPrice = +(itemsPrice * 0.05).toFixed(2);
  const shippingPrice = itemsPrice > 500 ? 0 : 50;

  /* -------------------------------------------------------------------------- */
  /*                              COUPON VALIDATION                              */
  /* -------------------------------------------------------------------------- */
  let appliedCoupon = null;
  let couponDiscount = 0;

  if (couponCode) {
    appliedCoupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!appliedCoupon) {
      res.status(400);
      throw new Error("Invalid or inactive coupon");
    }

    if (appliedCoupon.expiresAt && appliedCoupon.expiresAt < new Date()) {
      res.status(400);
      throw new Error("Coupon expired");
    }

    if (itemsPrice < appliedCoupon.minOrderValue) {
      res.status(400);
      throw new Error(
        `Minimum order value is ₹${appliedCoupon.minOrderValue}`
      );
    }

    // Prevent reuse (per user)
    const alreadyUsed = await Order.findOne({
      user: req.user._id,
      "coupon.code": appliedCoupon.code,
    });

    if (alreadyUsed) {
      res.status(400);
      throw new Error("Coupon already used");
    }

    // Calculate discount
    couponDiscount =
      (itemsPrice * appliedCoupon.discountPercent) / 100;

    if (
      appliedCoupon.maxDiscount > 0 &&
      couponDiscount > appliedCoupon.maxDiscount
    ) {
      couponDiscount = appliedCoupon.maxDiscount;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                              FINAL TOTAL                                   */
  /* -------------------------------------------------------------------------- */
  const totalPrice = +(
    itemsPrice +
    taxPrice +
    shippingPrice -
    couponDiscount
  ).toFixed(2);

  if (totalPrice < 0) {
    res.status(400);
    throw new Error("Invalid order total");
  }

  /* -------------------------------------------------------------------------- */
  /*                                CREATE ORDER                                 */
  /* -------------------------------------------------------------------------- */
  const order = new Order({
    user: req.user._id,
    orderItems: cart.items.map((it) => ({
      product: it.product._id,
      title: it.product.title,
      qty: it.qty,
      price: it.product.price,
      image: it.product.images?.[0]?.url || "",
    })),
    shippingAddress,
    paymentMethod,

    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,

    coupon: appliedCoupon
      ? {
          code: appliedCoupon.code,
          discountPercent: appliedCoupon.discountPercent,
          discountAmount: couponDiscount,
        }
      : undefined,

    appliedCoupon: appliedCoupon?._id,

    isPaid: paymentMethod !== "dummy",
    paidAt: paymentMethod !== "dummy" ? Date.now() : null,
  });

  const created = await order.save();

  /* -------------------------------------------------------------------------- */
  /*                              STOCK REDUCTION                                */
  /* -------------------------------------------------------------------------- */
  for (const it of cart.items) {
    const p = await Product.findById(it.product._id);
    if (p) {
      p.stock = Math.max(0, p.stock - it.qty);
      await p.save();
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                CLEAR CART                                   */
  /* -------------------------------------------------------------------------- */
  cart.items = [];
  await cart.save();

  /* -------------------------------------------------------------------------- */
  /*                            ORDER CONFIRMATION EMAIL                         */
  /* -------------------------------------------------------------------------- */
  (async () => {
    try {
      if (paymentMethod !== "dummy") {
        const populated = await Order.findById(created._id).populate(
          "user",
          "name email"
        );

        const to =
          populated.user?.email ||
          populated.shippingAddress?.email ||
          null;

        if (to) {
          await sendEmail({
            to,
            subject: `Your Scentiva order #${populated._id} is placed`,
            html: orderConfirmationTemplate({
              name:
                populated.user?.name ||
                populated.shippingAddress?.fullName ||
                "there",
              order: populated,
              appName: "Scentiva",
            }),
          });
        }
      }
    } catch (err) {
      console.error("CreateOrder confirmation email error:", err.message);
    }
  })();

  res.status(201).json(created);
});


// GET /api/orders/myorders
const getMyOrders = asyncHandler(async (req, res) => {
const orders = await Order.find({ user: req.user._id })
  .populate("orderItems.product", "title images")
  .sort({ createdAt: -1 });

  res.json(orders);
});

// GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json(order);
});

// PUT /api/orders/:id/status (admin) - update status + email user
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status || order.status;

  if (order.status === "delivered") {
    order.deliveredAt = Date.now();
    order.isDelivered = true;
  }

  const updated = await order.save();

  // 🔔 Status update email (processing/shipped/delivered/cancelled)
  (async () => {
    try {
      const to =
        updated.user?.email ||
        updated.shippingAddress?.email ||
        null;

      if (to) {
        await sendEmail({
          to,
          subject: `Your Scentiva order #${updated._id} is now ${updated.status}`,
          html: orderStatusUpdateTemplate({
            name:
              updated.user?.name ||
              updated.shippingAddress?.fullName ||
              "there",
            order: updated,
            appName: "Scentiva",
          }),
        });
      }
    } catch (err) {
      console.error("Order status email error:", err.message);
    }
  })();

  res.json(updated);
});

// GET /api/orders (admin) - paginated + filter
const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, keyword = "", status } = req.query;

  page = Number(page);
  limit = Number(limit);

  const query = {};

  if (status) query.status = status;

  // allow search by order id
  if (keyword) {
    query.$or = [{ _id: keyword }];
  }

  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate("user", "name email")
    .select(
      "orderItems shippingAddress paymentMethod isPaid paidAt status deliveredAt totalPrice createdAt user"
    )
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    orders,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});


module.exports = { createOrder, getMyOrders, getOrderById, updateOrderStatus,getAllOrdersAdmin  };
