require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

const seed = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@store.com',
      password: 'admin123',
      role: 'admin'
    });

    const user = await User.create({
      name: 'John Doe',
      email: 'john@doe.com',
      password: 'password123'
    });

    const cat1 = await Category.create({ name: 'Electronics', slug: 'electronics' });
    const cat2 = await Category.create({ name: 'Clothing', slug: 'clothing' });

    const products = [
      { title: 'Smartphone X', description: 'A nice phone', price: 699, category: cat1._id, brand: 'PhoneBrand', stock: 30, images: [{url: '/uploads/sample1.jpg'}] },
      { title: 'T-Shirt Blue', description: 'Comfortable tee', price: 19.99, category: cat2._id, brand: 'ClothBrand', stock: 100, images: [{url: '/uploads/sample2.jpg'}] },
      { title: 'Headphones Pro', description: 'Noise cancelling', price: 149.99, category: cat1._id, brand: 'AudioBrand', stock: 50, images: [{url: '/uploads/sample3.jpg'}] },
    ];
    await Product.insertMany(products);

    console.log('Seeded DB with users, categories, products');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
