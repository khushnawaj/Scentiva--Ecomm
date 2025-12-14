require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorMiddleware');
const paymentRoutes = require("./routes/paymentRoutes");
const testRoutes = require("./routes/testRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const wishlistRoutes = require("./routes/wishlistRouter");
const couponRoutes = require("./routes/couponRoutes");






const app = express();
connectDB(process.env.MONGO_URI);

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// static uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use("/api/payment", paymentRoutes);
//nodemailer
app.use("/api", testRoutes);
//newsLetter
app.use("/api/newsletter", newsletterRoutes);
//wishlist
app.use("/api/wishlist", wishlistRoutes);
//coupons
app.use("/api/coupons", couponRoutes);




app.get('/', (req, res) => res.send('API running'));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
