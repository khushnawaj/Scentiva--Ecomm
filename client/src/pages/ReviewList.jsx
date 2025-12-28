// src/components/ReviewList.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import { FiStar } from "react-icons/fi";

export default function ReviewList({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    api
      .get(`/reviews/product/${productId}`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];

        // newest first (extra safety)
        list.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setReviews(list);
      })
      .catch(() => {
        setReviews([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  /* ---------------------------- UI STATES ---------------------------- */

  if (loading) {
    return (
      <p className="text-sm text-gray-400">
        Loading reviews...
      </p>
    );
  }

  if (!reviews.length) {
    return (
      <p className="text-sm text-gray-400">
        No reviews yet.
      </p>
    );
  }

  /* ---------------------------- RENDER ------------------------------- */

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div
          key={r._id}
          className="border rounded-lg p-3 text-sm"
        >
          {/* Rating + user */}
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <FiStar
                key={n}
                size={14}
                className={
                  n <= r.rating
                    ? "text-gold fill-gold"
                    : "text-gray-300"
                }
              />
            ))}

            <span className="ml-2 text-xs text-gray-500">
              by {r.user?.name || "User"}
            </span>
          </div>

          {/* Comment */}
          {r.comment && (
            <p className="text-gray-600 leading-relaxed">
              {r.comment}
            </p>
          )}

          {/* Date */}
          <div className="mt-1 text-xs text-gray-400">
            {r.createdAt &&
              new Date(r.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
