import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHome, FiSearch } from "react-icons/fi";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center bg-white rounded-2xl shadow-soft p-8">
        {/* Big 404 */}
        <h1
          className="text-6xl font-bold mb-2"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#8B5E3C",
          }}
        >
          404
        </h1>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Page not found
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          The page you’re looking for doesn’t exist or may have been moved.
          Let’s get you back to something delightful.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-cream/40"
          >
            <FiArrowLeft />
            Go back
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg btn-primary text-sm"
          >
            <FiHome />
            Home
          </Link>

          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-cream/40"
          >
            <FiSearch />
            Browse products
          </Link>
        </div>
      </div>
    </div>
  );
}
