// client/src/pages/admin/ProductForm.jsx
import React, { useEffect, useRef, useState } from "react";
// { public_id }
import api from "../../api/api";
import ConfirmModal from "../ConfirmModal";
import { toast } from "react-hot-toast";
import {
  FiUpload,
  FiTrash2,
  FiCheckCircle,
  FiX,
  FiPlus,
  FiEdit,
  FiSave,
  FiSettings,
  // FiTag,
  FiDollarSign,
  FiPackage,
  FiStar,
  // FiHash,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

/**
 * Admin ProductForm — Scentiva themed
 * Fully responsive for all screen sizes, designed to fit within AdminDashboard layout
 */

const CategoryManagerModal = ({
  open,
  onClose,
  categories,
  catLoading,
  newCategoryName,
  setNewCategoryName,
  handleAddCategory,
  editingCategory,
  setEditingCategory,
  editCategoryName,
  setEditCategoryName,
  handleUpdateCategory,
  confirmDeleteCategory,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-start sm:items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-lg mx-auto mt-4 sm:mt-0 p-4 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
            Manage Categories
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Add Category Form */}
        <form
          onSubmit={handleAddCategory}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category name"
            className="flex-grow border px-3 py-2 rounded-lg focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base"
            disabled={catLoading}
          />
          <button
            type="submit"
            disabled={catLoading}
            className={`px-4 py-2 rounded-lg text-white inline-flex items-center justify-center gap-2 transition-colors text-sm sm:text-base min-w-[80px] ${
              catLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-wax hover:bg-wax-light"
            }`}
          >
            <FiPlus size={16} />
            <span>Add</span>
          </button>
        </form>

        {/* Category List */}
        <div className="max-h-64 sm:max-h-72 overflow-y-auto border rounded-lg p-3">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">
            Existing Categories ({categories.length})
          </p>
          {catLoading && categories.length === 0 && (
            <div className="text-gray-500 text-sm py-2">
              Loading categories...
            </div>
          )}
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c._id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                {editingCategory && editingCategory._id === c._id ? (
                  <form
                    onSubmit={handleUpdateCategory}
                    className="flex-grow flex gap-2 items-center"
                  >
                    <input
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="flex-grow border px-3 py-1.5 rounded text-sm focus:ring-2 focus:ring-wax focus:border-transparent"
                      disabled={catLoading}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <button
                        type="submit"
                        disabled={catLoading}
                        className="text-green-600 hover:text-green-800 transition-colors p-1.5 rounded hover:bg-green-50"
                        aria-label="Save category"
                      >
                        <FiSave size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded hover:bg-gray-100"
                        aria-label="Cancel edit"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-800 truncate pr-2">
                      {c.name}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(c);
                          setEditCategoryName(c.name);
                        }}
                        className="text-gray-500 hover:text-blue-600 transition-colors p-1.5 rounded hover:bg-blue-50"
                        aria-label={`Edit ${c.name}`}
                        disabled={catLoading}
                      >
                        <FiEdit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteCategory(c)}
                        className="text-gray-500 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50"
                        aria-label={`Delete ${c.name}`}
                        disabled={catLoading}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          {categories.length === 0 && !catLoading && (
            <div className="text-gray-500 text-sm italic py-4 text-center">
              No categories found. Add one above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ProductForm() {
  
  // form state
  const [title, setTitle] = useState("");
  // const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sku, setSku] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  // images
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  // categories
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [catLoading, setCatLoading] = useState(false);

  // Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  // fetch categories
  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const { data } = await api.get("/categories");
      setCategories(data || []);
      setCatLoading(false);
      return data;
    } catch (err) {
      console.error("Failed to fetch categories", err);
      toast.error(err?.response?.data?.message || "Failed to fetch categories");
      setCatLoading(false);
      return [];
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchCategories();
    })();
    return () => (mounted = false);
  }, []);

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.url?.startsWith("blob:")) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [previews]);

  useEffect(() => {
    if (!isEditMode) return;

    async function fetchProduct() {
      try {
        const { data } = await api.get(`/products/${id}`);

        setTitle(data.title || "");
        setDescription(data.description || "");
        setPrice(data.price || "");
        setDiscountPrice(data.discountPrice || "");
        setBrand(data.brand || "");
        setCategory(data.category?._id || "");
        setStock(data.stock || 0);
        setIsFeatured(Boolean(data.isFeatured));
        setSku(data.sku || "");

        // Existing images → previews only (no re-upload)
        if (Array.isArray(data.images)) {
setPreviews(
  data.images.map((img) => ({
    id: img.public_id,          // stable id
    url: img.url,
    name: "Existing Image",
    existing: true,
    public_id: img.public_id,   // 🔑 REQUIRED
  }))
);

        }
      } catch (err) {
        toast.error("Failed to load product for editing");
        console.error(err);
      }
    }

    fetchProduct();
  }, [id, isEditMode]);

  // handle selected files
  const onFilesSelected = (selectedFiles) => {
    if (!selectedFiles) return;
const arr = Array.from(selectedFiles);

// how many new files are allowed
const remainingSlots = 5 - files.length;
if (remainingSlots <= 0) {
  toast.error("Maximum 5 images allowed");
  return;
}

// only take allowed files
const allowedFiles = arr.slice(0, remainingSlots);

setFiles((prev) => [...prev, ...allowedFiles]);

const startIndex = previews.filter(p => !p.existing).length;

const newPreviews = allowedFiles.map((f, idx) => ({
  id: `${Date.now()}-${f.name}-${idx}`,
  url: URL.createObjectURL(f),
  name: f.name,
  existing: false,
  fileIndex: startIndex + idx,
}));

setPreviews((p) => [...p, ...newPreviews]);
toast.success(`${allowedFiles.length} file(s) added`);

  };

const removePreview = (id) => {
  setPreviews((prev) => {
    const target = prev.find((p) => p.id === id);
    if (!target) return prev;

    // EXISTING IMAGE → mark for backend deletion
    if (target.existing && target.public_id) {
setRemovedImages((r) => {
  if (r.some(img => img.public_id === target.public_id)) return r;
  return [...r, { public_id: target.public_id }];
});
    }

    // NEW IMAGE → remove correct file
if (!target.existing && typeof target.fileIndex === "number") {
  setFiles((files) =>
    files.filter((_, i) => i !== target.fileIndex)
  );

  if (target.url.startsWith("blob:")) {
    URL.revokeObjectURL(target.url);
  }
}


    toast("Image removed");
const updated = prev.filter((p) => p.id !== id);

// reindex remaining new images
let nextFileIndex = 0;
return updated.map((p) => {
  if (!p.existing) {
    return { ...p, fileIndex: nextFileIndex++ };
  }
  return p;
});
  });
};

  const resetForm = () => {
    setTitle("");
    // setSlug("");
    setDescription("");
    setPrice("");
    setDiscountPrice("");
    setBrand("");
    setCategory("");
    setStock(0);
    setIsFeatured(false);
    setSku("");
    previews.forEach((p) => {
      if (p.url?.startsWith("blob:")) {
        URL.revokeObjectURL(p.url);
      }
    });
    setFiles([]);
    setPreviews([]);
    setRemovedImages([]);
    setError(null);
    setSuccessMsg(null);
    toast.success("Form reset");
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
    // form.append("slug", slug || title);
    form.append("description", description);
    form.append("price", price);
    if (discountPrice) form.append("discountPrice", discountPrice);
    if (brand) form.append("brand", brand);
    form.append("category", category);
    form.append("stock", String(stock));
    form.append("isFeatured", isFeatured ? "true" : "false");
    if (sku) form.append("sku", sku);

    form.append(
  "existingImages",
  JSON.stringify(
    previews
      .filter((p) => p.existing)
      .map((p) => ({
        url: p.url,
        public_id: p.public_id,
      }))
  )
);

form.append("removedImages", JSON.stringify(removedImages));


    files.forEach((f) => form.append("images", f));

    try {
      setLoading(true);
      const promise = isEditMode
        ? api.put(`/products/${id}`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : api.post("/products", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      const res = await toast.promise(promise, {
        loading: isEditMode ? "Updating product..." : "Creating product...",
        success: () =>
          isEditMode
            ? "Product updated successfully!"
            : "Product created successfully!",
        error: (err) =>
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create product",
      });

      setSuccessMsg(
        isEditMode
          ? "Product updated successfully!"
          : typeof res === "object" && res.data
          ? `Product created! (ID: ${res.data._id})`
          : "Product created!"
      );

      // resetForm();
      navigate("/admin/products");
    } catch (err) {
      console.error("Create product failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create product. Check console for details.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Category CRUD Handlers ---

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return toast.error("Category name cannot be empty.");

    try {
      setCatLoading(true);
      const promise = api.post("/categories", { name });

      await toast.promise(promise, {
        loading: `Creating category '${name}'...`,
        success: (res) => {
          setCategories((prev) => [...prev, res.data]);
          setNewCategoryName("");
          return `Category '${res.data.name}' created!`;
        },
        error: (err) =>
          err?.response?.data?.message || `Failed to create category '${name}'`,
      });
    } catch (err) {
      // Handled by toast.promise
    } finally {
      setCatLoading(false);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    const name = editCategoryName.trim();
    if (!name) return toast.error("Category name cannot be empty.");
    if (editingCategory.name === name) {
      setEditingCategory(null);
      return;
    }

    try {
      setCatLoading(true);
      const promise = api.put(`/categories/${editingCategory._id}`, { name });

      await toast.promise(promise, {
        loading: `Updating category to '${name}'...`,
        success: (res) => {
          setCategories((prev) =>
            prev.map((c) => (c._id === res.data._id ? res.data : c))
          );
          if (category === editingCategory._id) {
            toast.success(`Selected category updated to ${res.data.name}`);
          }
          setEditingCategory(null);
          setEditCategoryName("");
          return `Category updated to '${res.data.name}'!`;
        },
        error: (err) =>
          err?.response?.data?.message ||
          `Failed to update category to '${name}'`,
      });
    } catch (err) {
      // Handled by toast.promise
    } finally {
      setCatLoading(false);
    }
  };

  const confirmDeleteCategory = (cat) => {
    setDeletingCategory(cat);
    setConfirmOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      setCatLoading(true);
      const categoryToDelete = deletingCategory;
      const promise = api.delete(`/categories/${categoryToDelete._id}`);

      await toast.promise(promise, {
        loading: `Deleting category '${categoryToDelete.name}'...`,
        success: (res) => {
          setCategories((prev) =>
            prev.filter((c) => c._id !== categoryToDelete._id)
          );
          if (category === categoryToDelete._id) {
            setCategory("");
            toast.info(
              `Selected category "${categoryToDelete.name}" was deleted.`
            );
          }
          setDeletingCategory(null);
          setConfirmOpen(false);
          return `Category '${categoryToDelete.name}' deleted!`;
        },
        error: (err) => {
          setDeletingCategory(null);
          setConfirmOpen(false);
          return (
            err?.response?.data?.message ||
            `Failed to delete category '${categoryToDelete.name}'`
          );
        },
      });
    } catch (err) {
      // Handled by toast.promise
    } finally {
      setCatLoading(false);
    }
  };

  // Determine modal content for ConfirmModal
  const getConfirmModalProps = () => {
    if (deletingCategory) {
      return {
        title: "Delete Category",
        message: `Are you sure you want to delete the category "${deletingCategory.name}"? This action cannot be undone.`,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        loading: catLoading,
        onConfirm: handleDeleteCategory,
        onCancel: () => {
          setConfirmOpen(false);
          setDeletingCategory(null);
        },
      };
    } else {
      return {
        title: "Reset Form",
        message:
          "Are you sure you want to reset the form? All unsaved changes will be lost.",
        confirmLabel: "Reset",
        cancelLabel: "Cancel",
        loading: false,
        onConfirm: resetForm,
        onCancel: () => setConfirmOpen(false),
      };
    }
  };

  const confirmModalProps = getConfirmModalProps();

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {isEditMode ? "Edit Product" : "New Product"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {isEditMode
              ? "Update product details"
              : "Add a product to your catalog"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {files.length} files • {previews.length} previews
          </span>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 animate-fadeIn">
          <FiX className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3 animate-fadeIn">
          <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-800 font-medium">Success</p>
            <p className="text-green-600 text-sm mt-1">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={submit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-xl border p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter product title"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base"
                required
              />
            </div>

            <div className="lg:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base resize-y"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Details Card */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiDollarSign className="text-wax" />
            Pricing & Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Discount Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₹
                </span>
                <input
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Brand</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand name"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-001"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Category Card */}
        <div className="bg-white rounded-xl border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiPackage className="text-wax" />
            Inventory & Category
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category *
              </label>
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base"
                  disabled={catLoading}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="px-3 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center"
                  aria-label="Manage Categories"
                  disabled={catLoading}
                >
                  <FiSettings size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Stock Quantity
              </label>
              <input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                type="number"
                min="0"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-wax focus:border-transparent text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiStar className="text-amber-500" />
                Featured Product
              </label>
              <div className="flex items-center h-12">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wax"></div>
                  <span className="ml-3 text-sm text-gray-700">
                    {isFeatured ? "Featured" : "Regular"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Images Upload Card */}
        <div className="bg-white rounded-xl border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUpload className="text-wax" />
            Product Images
          </h3>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label
                htmlFor="images"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-wax text-white hover:bg-wax-light transition-colors cursor-pointer text-sm sm:text-base font-medium"
              >
                <FiUpload />
                <span>Upload Images</span>
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
              <div className="text-sm text-gray-600">
                Supports PNG, JPG up to 5 files
              </div>
            </div>

            {/* Image Previews */}
            {previews.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Image Previews ({previews.length}/5)
                </p>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {previews.map((p, index) => (
                    <div
                      key={`${p.existing ? "existing" : "new"}-${p.id}`}

                      className="relative group rounded-lg overflow-hidden border aspect-square bg-gray-50"
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removePreview(p.id)}
                          className="bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          aria-label={`Remove ${p.name}`}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 px-2 truncate">
                        {p.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-sm text-gray-500 sm:hidden">
            {files.length} files • {previews.length} previews
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setDeletingCategory(null);
                setConfirmOpen(true);
              }}
              className="px-5 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 font-medium w-full sm:w-auto text-sm sm:text-base"
              disabled={loading}
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={loading || catLoading}
              className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors w-full sm:w-auto text-sm sm:text-base ${
                loading || catLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-wax hover:bg-wax-light"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </span>
              ) : isEditMode ? (
                "Update Product"
              ) : (
                "Create Product"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Category Management Modal */}
      <CategoryManagerModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        catLoading={catLoading}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        handleAddCategory={handleAddCategory}
        editingCategory={editingCategory}
        setEditingCategory={setEditingCategory}
        editCategoryName={editCategoryName}
        setEditCategoryName={setEditCategoryName}
        handleUpdateCategory={handleUpdateCategory}
        confirmDeleteCategory={confirmDeleteCategory}
      />

      {/* Confirm modal for Reset or Category Delete */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmModalProps.title}
        message={confirmModalProps.message}
        confirmLabel={confirmModalProps.confirmLabel}
        cancelLabel={confirmModalProps.cancelLabel}
        loading={confirmModalProps.loading}
        onConfirm={confirmModalProps.onConfirm}
        onCancel={confirmModalProps.onCancel}
      />
    </div>
  );
}
