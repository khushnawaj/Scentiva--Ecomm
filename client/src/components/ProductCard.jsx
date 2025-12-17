import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiStar } from "react-icons/fi";
import { normalizeMediaUrl } from "../utils/media";
import { useWishlist } from "../contexts/WishlistContext";
import toast from "react-hot-toast";

export default function ProductCard({
  product,
  // inWishlist: _initialInWishlist = false,
  onWishlistChange: _onWishlistChange,
}) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const productId = product?._id || product?.id;
  const wish = productId ? isInWishlist(productId) : false;

  const imgObj = product?.images?.[0] || {};
  // const rawUrl = imgObj.url || imgObj.filename || imgObj.path || null;
  const img =
    normalizeMediaUrl(imgObj) ||
    "https://via.placeholder.com/400x400.png?text=No+Image";

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!productId) {
      toast.error("Invalid product.");
      return;
    }

    // parent handler (Wishlist Page)
    if (typeof _onWishlistChange === "function") {
      try {
        _onWishlistChange(productId, !wish);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Toast-powered wishlist toggle
    try {
      await toast.promise(toggleWishlist(product), {
        loading: wish ? "Removing..." : "Adding...",
        success: wish ? "Removed from wishlist" : "Added to wishlist",
        error: "Failed to update wishlist",
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error("Please log in first");
        navigate("/login");
      }
    }
  };

  return (
    <div className="group rounded-2xl bg-white shadow-soft hover:shadow-lift transition-all duration-300 overflow-hidden border border-cream/40 relative">

      {/* ❤️ Circular Wishlist Button (fixed shape) */}
      <button
        type="button"
        aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
        onClick={handleToggleWishlist}
        className="
          absolute right-4 top-4 z-20
          w-10 h-10 flex items-center justify-center
          rounded-full bg-white/90 backdrop-blur-sm shadow
          hover:bg-cream/40 transition
        "
      >
        <FiHeart
          size={20}
          className={`transition-all duration-300 ${
            wish ? "text-flame fill-flame" : "text-gray-600"
          }`}
        />
      </button>

      {/* PRODUCT DISPLAY */}
      <Link to={productId ? `/product/${productId}` : "#"}>
        <div className="relative h-60 overflow-hidden">
          <img
            src={img}
            alt={product?.title || "Product image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/400x400.png?text=No+Image";
            }}
          />

          {product?.badge && (
            <span className="absolute left-3 top-3 bg-flame text-white text-xs px-3 py-1 rounded-full shadow">
              {product.badge}
            </span>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="p-4">
          <h3 className="font-semibold text-wax text-lg truncate">
            {product?.title || "Untitled product"}
          </h3>

          {product?.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="text-flame font-bold text-xl">
              ₹{product?.price ?? "--"}
            </div>

            <div className="flex items-center text-gold gap-1">
              <FiStar className="fill-gold text-gold" size={16} />
              <span className="text-sm text-textmuted">
                {product?.rating?.toFixed?.(1) ?? "0.0"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
