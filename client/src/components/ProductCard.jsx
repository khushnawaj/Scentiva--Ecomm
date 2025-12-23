// src/components/ProductCard.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiStar } from "react-icons/fi";
import { normalizeMediaUrl } from "../utils/media";
import { useWishlist } from "../contexts/WishlistContext";
import toast from "react-hot-toast";

export default function ProductCard({ product, onWishlistChange }) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const productId = product?._id || product?.id;
  const wish = productId ? isInWishlist(productId) : false;

  const imgObj = product?.images?.[0] || {};
const FALLBACK_IMAGE = "/placeholder.png";

const img = normalizeMediaUrl(imgObj) || FALLBACK_IMAGE;


  const averageRating = Number(product?.averageRating || 0);
  const ratingsCount = Number(product?.ratingsCount || 0);

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!productId) {
      toast.error("Invalid product");
      return;
    }

    try {
      await toast.promise(toggleWishlist(product), {
        loading: wish ? "Removing..." : "Adding...",
        success: wish ? "Removed from wishlist" : "Added to wishlist",
        error: "Failed to update wishlist",
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error("Please login first");
        navigate("/login");
      }
    }
  };

  return (
    <div className="group rounded-2xl bg-white shadow-soft hover:shadow-lift transition-all duration-300 overflow-hidden border border-cream/40 relative">
      {/* Wishlist */}
      <button
        type="button"
        onClick={handleToggleWishlist}
        className="absolute right-4 top-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/90 shadow"
      >
        <FiHeart
          size={20}
          className={wish ? "text-flame fill-flame" : "text-gray-600"}
        />
      </button>

      <Link to={productId ? `/product/${productId}` : "#"}>
        {/* Image */}
        <div className="relative h-60 overflow-hidden">
          <img
            src={img}
            alt={product?.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
onError={(e) => {
  e.currentTarget.onerror = null; // prevent loop
  e.currentTarget.src = FALLBACK_IMAGE;
}}

          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-wax text-lg truncate">
            {product?.title}
          </h3>

          {product?.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            {/* Price */}
            <div className="text-flame font-bold text-xl">
              ₹{product?.price}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <FiStar className="text-gold fill-gold" size={16} />
              {ratingsCount > 0 ? (
                <span className="text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({ratingsCount})
                </span>
              ) : (
                <span className="text-xs text-gray-400">No ratings</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
