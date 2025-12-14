// src/pages/Products.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/api";
import ProductCard from "../components/ProductCard";
import { FiFilter, FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Query params
  const keyword = searchParams.get("keyword") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [limit] = useState(9); // 9 products per page
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (!value) params.delete(key);
    else params.set(key, value);
    params.set("page", 1); // reset page on filter change
    setSearchParams(params);
  };

  // Fetch categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/categories");
        if (!mounted) return;
        setCats(data || []);
      } catch (err) {
        console.error("Failed to load categories", err);
        toast.error(err?.response?.data?.message || "Failed to load categories");
        if (mounted) setCats([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(
          `/products?keyword=${encodeURIComponent(
            keyword
          )}&category=${encodeURIComponent(
            category
          )}&sort=${encodeURIComponent(
            sort
          )}&page=${page}&limit=${limit}`
        );

        if (!mounted) return;
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("Products load error:", err);
        if (!mounted) return;
        setProducts([]);
        setTotalPages(1);
        toast.error(err?.response?.data?.message || "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [keyword, category, sort, page, limit]);

  const handlePage = (next) => {
    const newPage = next ? page + 1 : page - 1;
    if (newPage < 1 || newPage > totalPages) return;
    updateParam("page", newPage);
  };

  return (
    <div className="py-8">
      <div className="max-w-screen-2xl mx-auto px-6">
        <h2
          className="text-3xl font-semibold text-wax mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Browse Products
        </h2>

        {/* FILTER BAR */}
        <div className="bg-white p-4 rounded-xl shadow-soft mb-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
          {/* Search */}
          <div className="flex items-center border rounded-full px-3 py-2 flex-1 bg-cream/40">
            <FiSearch className="text-gray-500" />
            <input
              aria-label="Search products"
              placeholder="Search candles, scents, gifts, brands..."
              value={keyword}
              onChange={(e) => updateParam("keyword", e.target.value)}
              className="ml-3 w-full bg-transparent outline-none placeholder:text-gray-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-1 md:flex-none w-full md:w-auto">
            <FiFilter className="text-gray-500" />
            <select
              aria-label="Filter by category"
              className="border px-3 py-2 rounded w-full md:w-auto bg-white"
              value={category}
              onChange={(e) => updateParam("category", e.target.value)}
            >
              <option value="">All categories</option>
              {cats.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            aria-label="Sort products"
            className="border px-3 py-2 rounded w-full md:w-auto bg-white"
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden card-cosset p-4 animate-pulse h-72"
              />
            ))}
          </div>
        )}

        {/* NO PRODUCTS */}
        {!loading && products.length === 0 && (
          <div className="p-6 bg-white shadow rounded text-center text-gray-600">
            No products matched your search.
          </div>
        )}

        {/* PRODUCT GRID */}
        {!loading && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
              {products.map((p) => (
                <ProductCard key={p._id || p.id} product={p} />
              ))}
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handlePage(false)}
                disabled={page === 1}
                aria-label="Previous page"
                className={`px-4 py-2 rounded-full border flex items-center gap-2 ${
                  page === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-cream/40"
                }`}
              >
                <FiChevronLeft /> Previous
              </button>

              <span className="text-sm text-textmuted">
                Page <strong className="text-wax">{page}</strong> of {totalPages}
              </span>

              <button
                onClick={() => handlePage(true)}
                disabled={page === totalPages}
                aria-label="Next page"
                className={`px-4 py-2 rounded-full border flex items-center gap-2 ${
                  page === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-cream/40"
                }`}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
