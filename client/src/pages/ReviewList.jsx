// src/components/ReviewList.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import { FiStar } from "react-icons/fi";

export default function ReviewList({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    api
      .get(`/reviews/product/${productId}`)
      .then((res) => setReviews(res.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading reviews...</p>;
  }

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-400">No reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r._id} className="border rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <FiStar className="text-gold fill-gold" size={14} />
            <span className="text-sm font-medium">{r.rating}</span>
            <span className="text-xs text-gray-500">
              by {r.user?.name || "User"}
            </span>
          </div>
          {r.comment && (
            <p className="text-sm text-gray-600">{r.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
