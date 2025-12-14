// src/pages/ProductPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { normalizeMediaUrl, getPlaceholder } from "../utils/media";
import { CartContext } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { toast } from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  // Buy Now confirm modal
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  // heart (wishlist) animation toggle
  const [heartAnimating, setHeartAnimating] = useState(false);

  // Fetch product
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/products/${id}`, {
          signal: controller.signal,
        });

        if (!mounted) return;

        const prod = data.product || data;
        setProduct(prod);

        const firstImg =
          (prod?.images &&
            prod.images[0] &&
            (prod.images[0].url ||
              prod.images[0].filename ||
              prod.images[0].path)) ||
          null;

        setMainImage(firstImg);
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        console.error("Product fetch error:", err);
        toast.error("Failed to load product. Please try again.");
        if (!mounted) return;
        setError("Failed to load product. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProduct();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id]);

  const productId = product?._id || product?.id;
  const inWishlist = productId ? isInWishlist(productId) : false;

  const formatPrice = (p) => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Number(p || 0));
    } catch {
      return `₹${p}`;
    }
  };

  const normalizeRaw = (raw) =>
    normalizeMediaUrl(raw) || normalizeMediaUrl(getPlaceholder("image"));

  // Add to cart (wrapped with toast.promise)
  const handleAddToCart = async (opts = { productId: productId, quantity: qty }) => {
    const idToAdd = opts.productId;
    const quantity = opts.quantity ?? qty;

    if (!idToAdd) {
      toast.error("Invalid product");
      return;
    }

    setBusy(true);
    try {
      const promise = addToCart(idToAdd, Number(quantity) || 1);
      await toast.promise(promise, {
        loading: "Adding to cart...",
        success: "Added to cart",
        error: (err) => err?.response?.data?.message || "Failed to add to cart",
      });
    } catch (err) {
      // toast.promise already handled messaging
      console.error("Add to cart failed", err);
    } finally {
      setBusy(false);
    }
  };

  // Wishlist toggle with toast.promise and simple heart animation on success
  const handleToggleWishlist = async () => {
    if (!product || !productId) {
      toast.error("No product to wishlist");
      return;
    }

    setBusy(true);
    try {
      const nextLabel = inWishlist ? "Removing from wishlist..." : "Adding to wishlist...";
      const promise = toggleWishlist(product);

      await toast.promise(promise, {
        loading: nextLabel,
        success: () => {
          // Because the wishlist context updates, use the pre-toggle value to display correct message
          const doneMsg = inWishlist ? "Removed from wishlist" : "Added to wishlist";
          // trigger heart animation briefly on add
          if (!inWishlist) {
            setHeartAnimating(true);
            setTimeout(() => setHeartAnimating(false), 600);
          }
          return doneMsg;
        },
        error: (err) => err?.response?.data?.message || "Failed to update wishlist",
      });
    } catch (err) {
      console.error("Wishlist toggle failed", err);
      if (err?.response?.status === 401) {
        toast.error("Please login to use wishlist");
        navigate("/login");
      }
    } finally {
      setBusy(false);
    }
  };

  // Open Buy Now confirm modal
  const openBuyNowConfirm = () => {
    if (!productId) {
      toast.error("Invalid product");
      return;
    }
    setBuyNowOpen(true);
  };

  // Confirmed: add to cart then navigate to checkout (toast.promise inside)
  const confirmBuyNow = async () => {
    if (!productId) return;
    setBuyNowLoading(true);

    try {
      const promise = addToCart(productId, Number(qty) || 1);
      await toast.promise(promise, {
        loading: "Adding to cart...",
        success: "Added to cart — taking you to checkout",
        error: (err) => err?.response?.data?.message || "Failed to add to cart",
      });

      setBuyNowOpen(false);
      navigate("/checkout");
    } catch (err) {
      console.error("Buy Now failed", err);
      // toast.promise handles error message
    } finally {
      setBuyNowLoading(false);
    }
  };

  // Loading & error UI
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="w-full h-[420px] bg-gray-100 rounded-lg" />
          <div className="h-6 bg-gray-100 rounded w-3/5" />
          <div className="h-4 bg-gray-100 rounded w-2/5" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-red-500 mb-4">{error}</div>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-textmuted">Product not found</div>
      </div>
    );
  }

  const images =
    (product.images &&
      product.images.length &&
      product.images.map((img) => img.url || img.filename || img.path || img)) ||
    [];

  const mainRaw = mainImage || (images.length ? images[0] : null);
  const mainSrc = normalizeRaw(mainRaw);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Images */}
        <div>
          <div className="bg-white rounded-lg overflow-hidden border card-cosset">
            <img
              src={mainSrc}
              alt={product.title}
              className="w-full h-[520px] object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = normalizeRaw(getPlaceholder("image"));
              }}
            />
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => {
                const raw = img.url || img.filename || img.path || img;
                const selected = mainImage === raw || (!mainImage && i === 0);
                return (
                  <button
                    key={i}
                    onClick={() => setMainImage(raw)}
                    className={`w-20 h-20 rounded-md overflow-hidden border ${selected ? "ring-2 ring-flame" : ""}`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={normalizeRaw(raw)} alt={`${product.title}-${i}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div>
          <h1 className="text-2xl font-semibold text-wax mb-1">{product.title}</h1>
          {product.brand && <div className="text-sm text-textmuted mb-3">{product.brand}</div>}
          <div className="text-2xl font-bold mb-4">{formatPrice(product.price)}</div>

          {product.description && <div className="text-sm text-textmuted mb-4 whitespace-pre-line">{product.description}</div>}

          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm">Quantity</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
              className="w-20 px-2 py-1 border rounded"
              aria-label="Quantity"
            />
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={openBuyNowConfirm} className="btn-primary" disabled={busy || buyNowLoading}>
              {buyNowLoading ? "Processing..." : "Buy Now"}
            </button>

            <button onClick={() => handleAddToCart({ productId, quantity: qty })} className="btn-secondary" disabled={busy}>
              {busy ? "Adding..." : "Add to cart"}
            </button>

            {/* Animated heart wishlist button */}
            <button
              onClick={handleToggleWishlist}
              className={`btn-ghost flex items-center gap-2 ${inWishlist ? "text-flame" : "text-gray-700"}`}
              disabled={busy}
              aria-pressed={inWishlist}
            >
              <span
                className={`inline-block transform transition-transform duration-200 ${
                  heartAnimating ? "scale-125" : ""
                } ${inWishlist ? "fill-current" : ""}`}
                aria-hidden
              >
                {/* Simple heart SVG for crisp animation */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  className={`${inWishlist ? "text-flame" : "text-current"}`}
                >
                  <path
                    d="M12 21s-7-4.35-9-7.05C1.5 11.7 3 7.5 6.6 6.2 8.1 5.7 9.6 6 11 7.1c1.4-1.1 2.9-1.4 4.4-1 3.6 1.3 5.1 5.5 3.6 7.8C19 16.65 12 21 12 21z"
                    fill={inWishlist ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </svg>
              </span>
              <span>{inWishlist ? "In wishlist" : "Add to wishlist"}</span>
            </button>
          </div>

          <div className="text-sm text-textmuted mt-6 space-y-1">
            <div>SKU: {product.sku || "—"}</div>
            <div>Category: {product.category?.name || product.category || "—"}</div>
            {product.stock !== undefined && <div>Stock: {product.stock}</div>}
          </div>
        </div>
      </div>

      {/* Confirm modal for Buy Now */}
      <ConfirmModal
        open={buyNowOpen}
        title="Proceed to checkout?"
        message={`You are about to buy ${product?.title} (Qty: ${qty}). Continue to checkout?`}
        confirmLabel="Proceed"
        cancelLabel="Cancel"
        loading={buyNowLoading}
        onConfirm={confirmBuyNow}
        onCancel={() => setBuyNowOpen(false)}
      />
    </div>
  );
}
