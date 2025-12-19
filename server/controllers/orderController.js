const asyncHandler = require("express-async-handler");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const {
  orderStatusUpdateTemplate,
  orderConfirmationTemplate,
} = require("../utils/orderEmailTemplates");
const { sendEmail } = require("../utils/mailer");

// POST /api/orders - create order from cart (e.g. COD / dummy)
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Cart empty");
  }

  const itemsPrice = cart.items.reduce(
    (acc, it) => acc + it.product.price * it.qty,
    0
  );
  const taxPrice = +(itemsPrice * 0.05).toFixed(2);
  const shippingPrice = itemsPrice > 500 ? 0 : 50;
  const totalPrice = +(itemsPrice + taxPrice + shippingPrice).toFixed(2);

  const order = new Order({
    user: req.user._id,
    orderItems: cart.items.map((it) => ({
      product: it.product._id,
      title: it.product.title,
      qty: it.qty,
      price: it.product.price,
      image: it.product.images[0]?.url || "",
    })),
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: paymentMethod !== "dummy", // e.g. COD/dummy vs prepaid
    paidAt: paymentMethod !== "dummy" ? Date.now() : null,
  });

  const created = await order.save();

  // reduce stock
  for (const it of cart.items) {
    const p = await Product.findById(it.product._id);
    if (p) {
      p.stock = Math.max(0, p.stock - it.qty);
      await p.save();
    }
  }

  // empty cart
  cart.items = [];
  await cart.save();

  // 🔔 Order confirmation email (for non-dummy methods)
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
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
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
