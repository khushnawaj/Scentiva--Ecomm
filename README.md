# MERN E-commerce Full Starter (Expanded)

This repository contains a more complete MERN e-commerce starter.

## Quick start

1. Ensure MongoDB is running (local or Atlas).
2. Server:
   - cd server
   - cp .env.example .env
   - edit .env to configure MONGO_URI and JWT_SECRET
   - npm install
   - npm run seed
   - npm run dev

3. Client:
   - cd client
   - cp .env.example .env
   - npm install
   - npm run dev

Seeds:
- admin@store.com / admin123
- john@doe.com / password123

Notes:
- Images stored in server/uploads (placeholders included).
- For production, integrate Cloudinary or S3 for images and Stripe/Razorpay for payments.
