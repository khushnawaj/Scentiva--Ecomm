import React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import {
  FiBox,
  FiShoppingBag,
  FiMail,
  FiPlus,
  FiGrid,
} from "react-icons/fi";
import clsx from "clsx";

import AdminProductList from "./AdminProductList";
import ProductForm from "./ProductForm";
import OrderList from "./OrderList";
import NewsletterList from "./NewsletterList";
import DashboardStats from "./DashboardStats";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: FiGrid, path: "/admin/dashboard" },
    { key: "products", label: "Products", icon: FiBox, path: "/admin/products" },
    { key: "orders", label: "Orders", icon: FiShoppingBag, path: "/admin/orders" },
    { key: "newsletter", label: "Newsletter", icon: FiMail, path: "/admin/newsletter" },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-[#faf7f4] flex flex-col">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 bg-white border-b">
        {/* TOP BAR */}
        <div className="h-14 px-3 sm:px-6 flex items-center justify-between">
          <h1 className="font-semibold text-[#8B5E3C] text-sm sm:text-base">
            Admin Dashboard
          </h1>

          {/* Desktop Action */}
          <button
            onClick={() => navigate("/admin/products/new")}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded bg-wax text-white text-sm"
          >
            <FiPlus />
            New Product
          </button>
        </div>

        {/* NAV TABS */}
        <nav className="border-t bg-white">
          <div className="flex gap-1 px-2 sm:px-6 overflow-x-auto no-scrollbar">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => navigate(t.path)}
                  className={clsx(
                    "flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap border-b-2 transition",
                    isActive(t.path)
                      ? "border-wax text-wax font-medium"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  )}
                >
                  <Icon className="text-base" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="flex-1 p-3 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border rounded-lg p-3 sm:p-6">
            <Routes>
              {/* DASHBOARD */}
              <Route path="dashboard" element={<DashboardStats />} />
              <Route path="" element={<DashboardStats />} />

              {/* PRODUCTS */}
              <Route path="products" element={<AdminProductList />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />

              {/* OTHER SECTIONS */}
              <Route path="orders" element={<OrderList />} />
              <Route path="newsletter" element={<NewsletterList />} />
            </Routes>
          </div>
        </div>
      </main>

      {/* ================= MOBILE FAB ================= */}
      <button
        onClick={() => navigate("/admin/products/new")}
        className="sm:hidden fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-wax text-white flex items-center justify-center shadow-lg"
        aria-label="Add product"
      >
        <FiPlus size={20} />
      </button>
    </div>
  );
}
