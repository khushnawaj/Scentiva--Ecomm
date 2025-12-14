// src/App.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";

/**
 * App layout
 * - Keeps Navbar and Toaster persistent across routes
 * - Renders route children via <Outlet />
 */
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* single Toaster for the whole app */}
      <Toaster position="bottom-right" />

      {/* persistent Navbar */}
      <Navbar />

      {/* main content; children routes render inside Outlet */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
