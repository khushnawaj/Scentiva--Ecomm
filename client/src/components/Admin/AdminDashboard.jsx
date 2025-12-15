// client/src/admin/AdminDashboard.jsx
import React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { FiBox, FiShoppingBag, FiMail, FiPlus } from "react-icons/fi";
import clsx from "clsx";

import ProductForm from "./ProductForm";
import OrderList from "./OrderList";
import NewsletterList from "./NewsletterList";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { key: "products", label: "Products", icon: <FiBox />, path: "/admin/products" },
    { key: "orders", label: "Orders", icon: <FiShoppingBag />, path: "/admin/orders" },
    { key: "newsletter", label: "Newsletter", icon: <FiMail />, path: "/admin/newsletter" },
  ];

  const isActive = (path) =>
    location.pathname === path ||
    location.pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-20 bg-white border-b">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
          <h1 className="font-semibold text-[#8B5E3C]">
            Admin Dashboard
          </h1>

          <button
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-wax text-white text-sm"
          >
            <FiPlus /> New Product
          </button>
        </div>

        {/* ================= NAV TABS ================= */}
        <div className="border-t">
          <div className="flex gap-2 px-2 sm:px-6 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => navigate(t.path)}
                className={clsx(
                  "flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition",
                  isActive(t.path)
                    ? "border-wax text-wax font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border rounded-lg p-4 sm:p-6">
            <Routes>
              <Route path="products" element={<ProductForm />} />
              <Route path="orders" element={<OrderList />} />
              <Route path="newsletter" element={<NewsletterList />} />

              <Route
                index
                element={
                  <div className="py-16 text-center text-gray-600">
                    <h2 className="text-lg font-semibold text-[#8B5E3C]">
                      Welcome Admin
                    </h2>
                    <p className="mt-2 text-sm">
                      Select a section from above to begin.
                    </p>
                  </div>
                }
              />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}
