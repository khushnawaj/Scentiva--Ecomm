const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

// ---------------- ADMIN DASHBOARD ----------------
exports.getAdminDashboard = async (req, res) => {
  // Orders aggregation
  const orderAgg = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        revenue: { $sum: "$totalPrice" },
      },
    },
  ]);

  const ordersByStatus = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  let totalOrders = 0;
  let totalRevenue = 0;

  orderAgg.forEach((o) => {
    ordersByStatus[o._id] = o.count;
    totalOrders += o.count;
    totalRevenue += o.revenue;
  });

  const [products, users, outOfStock] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments(),
    Product.countDocuments({ stock: { $lte: 0 } }),
  ]);

  res.json({
    totals: {
      products,
      orders: totalOrders,
      users,
      revenue: totalRevenue,
    },
    ordersByStatus,
    inventory: {
      outOfStock,
    },
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};
