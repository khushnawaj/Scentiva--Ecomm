// src/router.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

import App from "./App";

// pages (CASE MUST MATCH FILE NAMES)
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import OrderSuccess from "./pages/OrderSuccess";
import Wishlist from "./pages/wishlist";

// admin
import AdminDashboard from "./components/Admin/AdminDashboard";

export default function createAppRouter() {
  return createBrowserRouter(
    [
      {
        path: "/",
        element: <App />,
        children: [
          { index: true, element: <Home /> },
          { path: "products", element: <Products /> },
          { path: "product/:id", element: <ProductPage /> },
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "orders", element: <MyOrders /> },
          { path: "order-success/:id", element: <OrderSuccess /> },
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
          { path: "profile", element: <Profile /> },
          { path: "wishlist", element: <Wishlist /> },
          { path: "admin/*", element: <AdminDashboard /> },
        ],
      },
    ],
    {
      future: { v7_relativeSplatPath: true },
    }
  );
}
