// client/src/pages/CartPage.jsx
import React, { useContext, useMemo, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { FiTrash2, FiPlus, FiMinus } from "react-icons/fi";
import { normalizeMediaUrl } from "../utils/media";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "react-hot-toast";

/**
 * CartPage - Scentiva Theme
 */

export default function CartPage() {
  const { cart = { items: [] }, addToCart, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "Confirm",
    message: "",
    confirmLabel: "Yes",
    cancelLabel: "Cancel",
    loading: false,
    resolve: null,
  });

  // Promise-wrapped confirm helper
  const confirm = (message, opts = {}) =>
    new Promise((resolve) => {
      setConfirmState({
        open: true,
        title: opts.title || "Confirm",
        message,
        confirmLabel: opts.confirmLabel || "Yes",
        cancelLabel: opts.cancelLabel || "Cancel",
        loading: false,
        resolve,
      });
    });

  const onConfirm = () => {
    if (confirmState.resolve) confirmState.resolve(true);
    setConfirmState((s) => ({ ...s, open: false, resolve: null }));
  };

  const onCancel = () => {
    if (confirmState.resolve) confirmState.resolve(false);
    setConfirmState((s) => ({ ...s, open: false, resolve: null }));
  };

  // Format INR
  const fmt = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(v);

  // Compute totals
  const totals = useMemo(() => {
    const itemsPrice = (cart.items || []).reduce((acc, it) => {
      const price = it.price ?? it.product?.price ?? 0;
      const qty = it.qty ?? 0;
      return acc + price * qty;
    }, 0);

    const tax = +(itemsPrice * 0.05).toFixed(2);
    const shipping = itemsPrice > 500 || itemsPrice === 0 ? 0 : 50;
    const total = +(itemsPrice + tax + shipping).toFixed(2);

    return { itemsPrice, tax, shipping, total };
  }, [cart]);

  // Update quantity (with toast.promise)
  const updateQty = async (productId, newQty) => {
    if (!productId) return;
    if (newQty < 1) return;
    setUpdatingId(productId);

    const promise = addToCart(productId, newQty);

    try {
      await toast.promise(promise, {
        loading: "Updating quantity…",
        success: "Quantity updated",
        error: "Unable to update quantity",
      });
    } catch (err) {
      // error message already shown by toast.promise
      console.error("Failed to update qty", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Remove item (confirm modal + toast.promise)
  const handleRemove = async (productId) => {
    if (!productId) return;
    const ok = await confirm("Remove this item from your cart?");
    if (!ok) return;

    setUpdatingId(productId);
    const promise = removeFromCart(productId);

    try {
      await toast.promise(promise, {
        loading: "Removing item…",
        success: "Item removed",
        error: "Unable to remove item",
      });
    } catch (err) {
      console.error("Remove failed", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Empty cart UI
  if (!cart.items || cart.items.length === 0) {
    return (
      <>
        <ConfirmModal
          open={confirmState.open}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          loading={confirmState.loading}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />

        <div className="py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-3xl font-semibold mb-6"
              style={{ fontFamily: "'Playfair Display', serif", color: "#8B5E3C" }}
            >
              Your Cart
            </h2>

            <div className="bg-white card-cosset p-8 rounded-2xl text-center">
              <p className="text-gray-700 mb-6">
                Your cart is currently empty — discover our warm candles & gift boxes.
              </p>
              <Link to="/products" className="inline-block btn-primary">
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        loading={confirmState.loading}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      <div className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl font-semibold mb-6"
            style={{ fontFamily: "'Playfair Display', serif", color: "#8B5E3C" }}
          >
            Your Cart
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {(cart.items || []).map((it) => {
                const product = it.product || {};
                const productId = product._id;
                const qty = it.qty ?? 1;
                const price = it.price ?? product.price ?? 0;

                // FIXED IMAGE HANDLING
                const imgObj = product.images?.[0] || {};
                const raw = imgObj.url || imgObj.filename || imgObj.path || null;

                const imgSrc = normalizeMediaUrl(raw) || "/placeholder.png";

                return (
                  <div
                    key={productId}
                    className="flex gap-4 bg-white card-cosset rounded-2xl p-4 items-center"
                  >
                    <img
                      src={imgSrc}
                      alt={product.title || "Product image"}
                      loading="lazy"
                      className="w-28 h-28 object-cover rounded-md flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png";
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${productId}`}
                        className="font-medium text-wax text-lg hover:underline block truncate"
                      >
                        {product.title || "Product"}
                      </Link>

                      <div className="text-sm text-gray-500 mt-1 truncate">
                        {product.description || ""}
                      </div>

                      {/* Quantity + Price */}
                      <div className="mt-4 flex items-center justify-between gap-4">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 bg-cream/60 rounded-md p-1">
                          <button
                            aria-label="Decrease quantity"
                            onClick={() => updateQty(productId, qty - 1)}
                            disabled={updatingId === productId || qty <= 1}
                            className="p-2 rounded border border-cream/40 hover:bg-cream/30 disabled:opacity-50"
                          >
                            <FiMinus />
                          </button>

                          <div className="px-4 py-1 font-medium">{qty}</div>

                          <button
                            aria-label="Increase quantity"
                            onClick={() => updateQty(productId, qty + 1)}
                            disabled={updatingId === productId}
                            className="p-2 rounded border border-cream/40 hover:bg-cream/30"
                          >
                            <FiPlus />
                          </button>
                        </div>

                        {/* Price + Remove */}
                        <div className="flex items-center gap-4">
                          <div className="font-bold text-lg text-wax">{fmt(price * qty)}</div>

                          <button
                            onClick={() => handleRemove(productId)}
                            className="text-red-600 flex items-center gap-2 text-sm hover:underline"
                            disabled={updatingId === productId}
                          >
                            <FiTrash2 />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <aside className="bg-white card-cosset rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Order summary</h3>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Items ({cart.items.length})</span>
                  <span>{fmt(totals.itemsPrice)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>{fmt(totals.tax)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{totals.shipping === 0 ? "Free" : fmt(totals.shipping)}</span>
                </div>

                <div className="border-t my-3" />

                <div className="flex justify-between items-center font-bold text-xl text-wax">
                  <span>Total</span>
                  <span>{fmt(totals.total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate("/checkout")}
                  disabled={cart.items.length === 0}
                  className={`w-full ${cart.items.length === 0 ? "bg-gray-300 cursor-not-allowed text-gray-700" : "btn-primary"}`}
                >
                  Proceed to Checkout
                </button>

                <Link to="/products" className="block text-center text-sm text-gray-700 hover:underline">
                  Continue shopping
                </Link>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                Estimated delivery & taxes calculated at checkout. Free shipping over ₹500.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
