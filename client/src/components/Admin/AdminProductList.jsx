import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { normalizeMediaUrl } from "../../utils/media";
import ConfirmModal from "../ConfirmModal";
import toast from "react-hot-toast";

/* ---------------------- STOCK BADGE ---------------------- */
const StockBadge = ({ stock }) => {
  const qty = Number(stock || 0);

  if (qty === 0)
    return (
      <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
        Out of stock
      </span>
    );

  if (qty <= 5)
    return (
      <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
        Low ({qty})
      </span>
    );

  return (
    <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
      In stock ({qty})
    </span>
  );
};

export default function AdminProductList() {
  const navigate = useNavigate();

  /* ---------------------------- STATE ---------------------------- */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 10;

  /* ------------------------ FETCH CATEGORIES ------------------------ */
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data || []));
  }, []);

  /* ------------------------- FETCH PRODUCTS ------------------------- */
  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await api.get("/products", {
          signal: controller.signal,
          params: {
            page,
            limit,
            keyword: keyword || undefined,
            category: category || undefined,
            sort,
          },
        });

        setProducts(res.data.products || []);
        setPages(res.data.pages || 1);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    return () => controller.abort();
  }, [page, keyword, category, sort]);

  /* -------------------------- DELETE -------------------------- */
  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await toast.promise(api.delete(`/products/${deleteTarget._id}`), {
        loading: "Deleting product...",
        success: "Product deleted",
        error: "Delete failed",
      });
      setProducts((p) => p.filter((x) => x._id !== deleteTarget._id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  /* ----------------------------- UI ----------------------------- */
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Products</h2>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="px-3 py-2 bg-wax text-white rounded text-sm"
        >
          + Add Product
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={keyword}
          onChange={(e) => {
            setPage(1);
            setKeyword(e.target.value);
          }}
          placeholder="Search products..."
          className="border px-3 py-2 rounded text-sm w-full sm:w-52"
        />

        <select
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
          className="border px-3 py-2 rounded text-sm w-full sm:w-auto"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => {
            setPage(1);
            setSort(e.target.value);
          }}
          className="border px-3 py-2 rounded text-sm w-full sm:w-auto"
        >
          <option value="newest">Newest</option>
          <option value="priceAsc">Price ↑</option>
          <option value="priceDesc">Price ↓</option>
        </select>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="space-y-3 sm:hidden">
        {loading ? (
          <p className="text-center text-gray-500">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products found</p>
        ) : (
          products.map((p) => (
            <div
              key={p._id}
              className="border rounded-lg p-3 bg-white space-y-2"
            >
              <div className="flex gap-3">
                <img
                  src={normalizeMediaUrl(p.images?.[0]?.url)}
                  alt={p.title}
                  className="w-14 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.title}</p>
                  <p className="text-sm text-gray-600">₹{p.price}</p>
                  <StockBadge stock={p.stock} />
                </div>
              </div>

              <div className="flex justify-end gap-4 text-sm">
                <button
                  onClick={() =>
                    navigate(`/admin/products/${p._id}/edit`)
                  }
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(p)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden sm:block border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Image</th>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Stock</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  Loading products…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p._id}
                  className={`border-t ${
                    Number(p.stock) === 0 ? "bg-red-50" : ""
                  }`}
                >
                  <td className="p-2">
                    <img
                      src={normalizeMediaUrl(p.images?.[0]?.url)}
                      alt={p.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="p-2">{p.title}</td>
                  <td className="p-2">₹{p.price}</td>
                  <td className="p-2">
                    <StockBadge stock={p.stock} />
                  </td>
                  <td className="p-2 space-x-3">
                    <button
                      onClick={() =>
                        navigate(`/admin/products/${p._id}/edit`)
                      }
                      className="text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {pages}
          </span>
          <button
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* DELETE CONFIRM */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Product"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.title}" permanently?`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
