# Scentiva - Modern E-Commerce Platform 🛍️
[![MERN Stack](https://img.shields.io/badge/MERN-Full%20Stack-000000?style=for-the-badge&logo=react&logoColor=61DAFB)](https://github.com/your-username/Scentiva-E-Comm)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)]()

Scentiva is a comprehensive full-stack e-commerce application designed to provide a seamless shopping experience. Built with the **MERN stack** (MongoDB, Express, React, Node.js), it features a premium UI, secure authentication, payment integration, and robust admin tools.

## 🚀 Live Demo
**[🌐 Visit Live Site (Vercel)](https://scentiva-lac.vercel.app/)** 

## ✨ Key Features

### User Features
- **🔐 Secure Authentication**: User registration, login, and password reset functionalities powered by JWT and secure cookie management.
- **🛍️ Product Browsing**: Advanced product filtering, searching, and categorization to help users find what they need.
- **🛒 Smart Cart**: Real-time cart management with quantity adjustments and dynamic price calculation.
- **💖 Wishlist**: Save favorite items to a personalized wishlist for future purchase.
- **💳 Secure Payments**: Integrated **Razorpay** payment gateway for safe and reliable transactions.
- **📦 Order Tracking**: track order status from processing to delivery.
- **⭐ Product Reviews**: User ratings and reviews system to build trust and community.
- **📧 Email Notifications**: Automated emails for welcome messages, order confirmations, and password resets using **Nodemailer**.

### Admin Features
- **📊 Dashboard**: Comprehensive overview of sales, orders, and customer data.
- **📦 Product Management**: Create, edit, and delete products with image hosting via **Cloudinary**.
- **🚚 Order Management**: Process orders, update dispatch status, and manage deliverables.
- **🎫 Coupon System**: Create and manage discount coupons and promotional codes.

## 🛠️ Technology Stack

### Frontend
- **React.js (Vite)**: Fast and responsive user interface.
- **Tailwind CSS**: Utility-first CSS framework for modern styling.
- **React Router**: Seamless client-side navigation.
- **Axios**: Efficient HTTP client for API interaction.
- **React Hot Toast**: Elegant notifications for user feedback.

### Backend
- **Node.js & Express**: Robust server-side runtime and framework.
- **MongoDB & Mongoose**: Flexible NoSQL database with object modeling.
- **JWT (JSON Web Token)**: Secure stateless authentication.
- **Bcrypt.js**: Industry-standard password hashing.

### Third-Party Services
- **Cloudinary**: Cloud-based image management and optimization.
- **Razorpay**: Secure payment gateway integration.
- **Nodemailer**: Service for sending transactional emails.

## 📂 Project Structure

```bash
Scentiva-E-Comm/
├── client/                 # React Frontend Application
│   ├── src/
│   │   ├── api/            # API service layers
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Context provider (Auth, Cart, etc.)
│   │   ├── pages/          # Full page views
│   │   ├── utils/          # Frontend helper functions
│   │   └── ...
├── server/                 # Node.js Express API
│   ├── config/             # Configurations (DB, Cloudinary, Razorpay)
│   ├── controllers/        # Business logic for routes
│   ├── models/             # Database schemas
│   ├── routes/             # API endpoint definitions
│   ├── utils/              # Backend helpers (Mailer, Seeders)
│   └── ...
└── README.md               # Project documentation
```

## ⚙️ Installation & Setup Follow the steps below to set up the project locally.

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (Local instance or Atlas URI)
- **Git**

### 1. Clone the Repository
```bash
git https://github.com/khushnawaj/Scentiva--Ecomm
cd Scentiva--Ecomm
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and populate it with your credentials:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Service (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=support@scentiva.com
ADMIN_EMAIL=admin@scentiva.com
```

**Optional: Seed Database**
Populate the database with initial sample data:
```bash
npm run seed
```

Start the backend server:
```bash
npm run dev
```

### 3. Client Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

The application will launch at `http://localhost:5173`.

## 📡 API Overview

The backend exposes the following main API resource groups:

- **/api/auth**: User authentication and profile management.
- **/api/products**: Product catalog, filtering, and details.
- **/api/cart**: Shopping cart operations.
- **/api/orders**: Order creation, history, and administration.
- **/api/payment**: Payment verification and processing.
- **/api/admin**: Dashboard statistics and admin-only actions.

---

Developed with ❤️ by Khushnawaj.
