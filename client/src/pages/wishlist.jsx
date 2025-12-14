// src/pages/Wishlist.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ConfirmModal from "../components/ConfirmModal"; // fixed name
import { useWishlist } from "../contexts/WishlistContext";
import toast from "react-hot-toast";

export default function Wishlist() {
  const {
    wishlistItems,
    wishlistLoading,
    wishlistError,
    toggleWishlist,
  } = useWishlist();

  const [pendingRemove, setPendingRemove] = useState(null); // { productId, title }
  const [removingId, setRemovingId] = useState(null);

  const navigate = useNavigate();

  // When ProductCard calls onWishlistChange(productId, newInWishlist)
  const handleWishlistChange = async (productId, inWishlist) => {
    if (!inWishlist) {
      const product = wishlistItems.find((p) => (p._id || p.id) === productId);
      setPendingRemove({
        productId,
        title: product?.title ?? "this item",
      });
      return;
    }

    // Add (rare case)
    try {
      await toggleWishlist(productId);
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
      toast.error("Failed to update wishlist");
    }
  };

  // Confirm remove
  const confirmRemove = async () => {
    if (!pendingRemove) return;
    const { productId } = pendingRemove;

    setRemovingId(productId);

    try {
      await toggleWishlist(productId); // context handles removal
      toast("Removed from wishlist", { icon: "🗑️" });
    } catch (err) {
      console.error("Failed remove:", err);
      toast.error("Failed to remove item");
    } finally {
      setPendingRemove(null);
      setRemovingId(null);
    }
  };

  const cancelRemove = () => {
    setPendingRemove(null);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-wax">My Wishlist</h1>
          <p className="text-sm text-textmuted">
            Save your favourite scents & gift ideas here.
          </p>
        </div>
        <Link to="/products" className="text-sm text-flame hover:underline">
          Browse products
        </Link>
      </div>

      {/* Loading skeleton */}
      {wishlistLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-lg shadow animate-pulse h-56"
            />
          ))}
        </div>
      )}

      {/* Error states */}
      {!wishlistLoading && wishlistError && (
        <div className="bg-white p-4 rounded-lg shadow text-center text-textmuted">
          <p className="mb-3">
            {wishlistError === "Not logged in"
              ? "Please login to view your wishlist."
              : "Failed to load wishlist."}
          </p>
          {wishlistError === "Not logged in" && (
            <button onClick={() => navigate("/login")} className="btn-primary">
              Go to login
            </button>
          )}
        </div>
      )}

      {/* Empty wishlist */}
      {!wishlistLoading &&
        !wishlistError &&
        (!wishlistItems || wishlistItems.length === 0) && (
          <div className="bg-white p-6 rounded-lg shadow text-center text-textmuted">
            <p>Your wishlist is empty.</p>
            <p className="mt-1">Start adding products you love.</p>
            <Link to="/products" className="btn-primary mt-4 inline-block">
              Shop now
            </Link>
          </div>
        )}

      {/* Wishlist grid */}
      {!wishlistLoading &&
        !wishlistError &&
        wishlistItems &&
        wishlistItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
              {wishlistItems.map((p) => (
                <ProductCard
                  key={p._id || p.id}
                  product={p}
                  inWishlist={true}
                  onWishlistChange={handleWishlistChange}
                />
              ))}
            </div>
          </>
        )}

      {/* Confirm modal */}
      <ConfirmModal
        open={!!pendingRemove}
        title="Remove item from wishlist?"
        message={
          pendingRemove
            ? `Remove "${pendingRemove.title}" from your wishlist?`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Keep"
        loading={removingId === pendingRemove?.productId}
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />
    </div>
  );
}
