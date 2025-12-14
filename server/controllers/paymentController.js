// server/controllers/paymentController.js
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const {
  orderConfirmationTemplate,
  adminNewOrderTemplate,
} = require("../utils/orderEmailTemplates");
const { sendEmail } = require("../utils/mailer");

const createRazorpayOrderFromCart = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );
  if (!cart || !cart.items.length) {
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

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalPrice * 100),
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  });

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
    paymentMethod: "razorpay",
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    isPaid: false,
    paidAt: null,
    paymentResult: {
      id: razorpayOrder.id,
      status: razorpayOrder.status,
      update_time: "",
      email_address: "",
    },
  });

  const createdOrder = await order.save();

  res.json({
    success: true,
    razorpayKey: process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    orderId: createdOrder._id,
  });
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !orderId
  ) {
    res.status(400);
    throw new Error("Missing payment verification data");
  }

  const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  if (expectedSign !== razorpay_signature) {
    res.status(400);
    throw new Error("Invalid payment signature");
  }

  const order = await Order.findById(orderId).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.paymentResult?.id && order.paymentResult.id !== razorpay_order_id) {
    res.status(400);
    throw new Error("Razorpay order mismatch");
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentResult = {
    id: razorpay_order_id,
    status: "paid",
    update_time: new Date().toISOString(),
    email_address:
      order.shippingAddress?.email ||
      order.user?.email ||
      "",
  };
  order.status = "processing";

  await order.save();

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );
  if (cart && cart.items.length) {
    for (const it of cart.items) {
      const p = await Product.findById(it.product._id);
      if (p) {
        p.stock = Math.max(0, p.stock - it.qty);
        await p.save();
      }
    }
    cart.items = [];
    await cart.save();
  }

  // 5) Send emails (customer + admin) non-blocking
  (async () => {
    try {
      const customerEmail =
        order.user?.email ||
        order.shippingAddress?.email ||
        null;

      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `Your Scentiva order #${order._id} is confirmed`,
          html: orderConfirmationTemplate({
            name:
              order.user?.name ||
              order.shippingAddress?.fullName ||
              "there",
            order,
            appName: "Scentiva",
          }),
        });
      }

      const adminEmail =
        process.env.ADMIN_EMAIL || process.env.EMAIL_USER || null;

      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `New Scentiva order #${order._id}`,
          html: adminNewOrderTemplate({
            order,
            user: order.user,
            appName: "Scentiva",
          }),
        });
      }
    } catch (err) {
      console.error("Order email error:", err.message);
    }
  })();

  res.json({ success: true, order });
});

module.exports = {
  createRazorpayOrderFromCart,
  verifyRazorpayPayment,
};
