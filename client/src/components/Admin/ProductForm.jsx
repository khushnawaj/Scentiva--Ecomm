// client/src/pages/admin/ProductForm.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import ConfirmModal from "../ConfirmModal";
import { toast } from "react-hot-toast";
import { FiUpload, FiTrash2, FiCheckCircle, FiX } from "react-icons/fi";

/**
 * Admin ProductForm — Scentiva themed
 *
 * - Uses toast notifications
 * - ConfirmModal used for Reset confirmation
 * - Fixed setError bug
 */

export default function ProductForm() {
  // form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sku, setSku] = useState("");

  // images
  const [files, setFiles] = useState([]); // File objects
  const [previews, setPreviews] = useState([]); // { id, url, name, size }

  // categories
  const [categories, setCategories] = useState([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // FIX: include setError
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  // Confirm modal state for Reset
  const [confirmOpen, setConfirmOpen] = useState(false);

  // fetch categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/categories");
        if (!mounted) return;
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
        toast.error(err?.response?.data?.message || "Failed to fetch categories");
      }
    })();
    return () => (mounted = false);
  }, []);

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  // handle selected files
  const onFilesSelected = (selectedFiles) => {
    if (!selectedFiles) return;
    const arr = Array.from(selectedFiles);
    // merge with existing keeping limit to 8
    const mergedFiles = [...files, ...arr].slice(0, 8);
    setFiles(mergedFiles);

    const newPreviews = arr.map((f, idx) => ({
      id: `${Date.now()}-${f.name}-${idx}`,
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
    }));
    setPreviews((p) => [...p, ...newPreviews].slice(0, 8));
    toast.success(`${arr.length} file(s) added`);
  };

  const removePreview = (id) => {
    setPreviews((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx >= 0) {
        URL.revokeObjectURL(prev[idx].url);
      }
      const newP = prev.filter((x) => x.id !== id);
      // remove corresponding file by index if possible
      setFiles((f) => {
        const copy = [...f];
        if (idx >= 0 && idx < copy.length) {
          copy.splice(idx, 1);
        }
        return copy;
      });
      toast("Preview removed");
      return newP;
    });
  };

  // auto slug from title
  useEffect(() => {
    if (!title) {
      setSlug("");
      return;
    }
    const s = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 100);
    setSlug(s);
  }, [title]);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setBrand("");
    setCategory("");
    setStock(0);
    setIsFeatured(false);
    setSku("");
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setFiles([]);
    setPreviews([]);
    setError(null);
    setSuccessMsg(null);
    toast("Form reset");
    setConfirmOpen(false);
  };

  const validate = () => {
    if (!title.trim()) return "Title is required.";
    if (!price || Number(price) <= 0) return "Price must be a positive number.";
    if (discountPrice && Number(discountPrice) <= 0)
      return "Discount price must be positive.";
    if (!category) return "Please select a category.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const v = validate();
    if (v) {
      setError(v);
      toast.error(v);
      return;
    }

    const form = new FormData();
    form.append("title", title);
    form.append("slug", slug || title);
    form.append("description", description);
    form.append("price", price);
    if (discountPrice) form.append("discountPrice", discountPrice);
    if (brand) form.append("brand", brand);
    form.append("category", category);
    form.append("stock", String(stock));
    form.append("isFeatured", isFeatured ? "true" : "false");
    if (sku) form.append("sku", sku);

    files.forEach((f) => form.append("images", f));

    try {
      setLoading(true);
      const promise = api.post("/products", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const res = await toast.promise(promise, {
        loading: "Creating product...",
        success: (res) => {
          const data = res?.data;
          let msg = "Product created successfully.";
          if (data && data._id) msg += ` (ID: ${data._id})`;
          return msg;
        },
        error: (err) =>
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create product",
      });

      // update inline success (optional) and reset form
      setSuccessMsg(typeof res === "object" && res.data ? `Product created (ID: ${res.data._id})` : "Product created");
      resetForm();
    } catch (err) {
      console.error("Create product failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create product. Check console for details.";
      setError(msg);
      // toast.promise already showed error, but ensure inline error too
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: "'Playfair Display', serif", color: "#8B5E3C" }}
        >
          Create Product
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded flex items-center gap-2">
          <FiX /> <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded flex items-center gap-2">
          <FiCheckCircle /> <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={submit} className="card-cosset p-6 rounded-2xl space-y-6">
        {/* title / slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-textmuted">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product title"
              className="mt-2 w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-textmuted">
              Slug (auto)
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="product-slug"
              className="mt-2 w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        {/* description */}
        <div>
          <label className="text-sm font-medium text-textmuted">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            rows={5}
            className="mt-2 w-full border px-3 py-2 rounded resize-y"
          />
        </div>

        {/* pricing, brand & sku */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-textmuted">
              Price (₹)
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 499.99"
              className="mt-2 w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-textmuted">
              Discount Price (optional)
            </label>
            <input
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 449.99"
              className="mt-2 w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-textmuted">Brand</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Brand name"
              className="mt-2 w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-textmuted">SKU</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU code (optional)"
              className="mt-2 w-full border px-3 py-2 rounded"
            />
          </div>
        </div>

        {/* category / stock / featured */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-sm font-medium text-textmuted">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full border px-3 py-2 rounded"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-textmuted">Stock</label>
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              type="number"
              min="0"
              className="mt-2 w-full border px-3 py-2 rounded"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="featured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-wax"
            />
            <label htmlFor="featured" className="text-sm text-textmuted">
              Mark as featured
            </label>
          </div>
        </div>

        {/* image uploader */}
        <div>
          <div className="flex items-center gap-3">
            <label
              htmlFor="images"
              className="inline-flex items-center gap-2 px-4 py-2 btn-primary cursor-pointer select-none"
            >
              <FiUpload />
              <span>Upload images</span>
            </label>

            <input
              id="images"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFilesSelected(e.target.files)}
            />

            <div className="text-sm text-gray-500">
              PNG, JPG — up to 8 files
            </div>
          </div>

          {/* previews */}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {previews.map((p) => (
                <div
                  key={p.id}
                  className="relative rounded overflow-hidden border"
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    className="w-full h-28 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePreview(p.id)}
                    className="absolute top-2 right-2 bg-white/90 p-1 rounded-full hover:bg-white"
                    aria-label={`Remove ${p.name}`}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-wax hover:bg-wax-light"
            }`}
          >
            {loading ? "Creating..." : "Create product"}
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="px-3 py-2 rounded border"
          >
            Reset
          </button>

          <div className="text-sm text-gray-500 ml-auto">
            {files.length} file(s) selected • {previews.length} preview(s)
          </div>
        </div>
      </form>

      {/* Confirm reset modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Reset form"
        message="Are you sure you want to reset the form? All unsaved changes will be lost."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        loading={false}
        onConfirm={resetForm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
