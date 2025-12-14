const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getCart, addToCart, removeFromCart } = require('../controllers/cartController');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.delete('/:productId', protect, removeFromCart);

module.exports = router;
