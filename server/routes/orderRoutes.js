const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/authMiddleware');
const { createOrder, getMyOrders, getOrderById, updateOrderStatus, getAllOrdersAdmin } = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);
//admin route
router.get("/", protect, admin, getAllOrdersAdmin);

module.exports = router;
