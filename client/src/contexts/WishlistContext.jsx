import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]); // full products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // helper to get product id
  const getId = (p) => (typeof p === "string" ? p : p?._id || p?.id);

  // -------------------------
  // Initial load
  // -------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/wishlist");
        if (!mounted) return;
        setWishlistItems(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.status === 401 ? "Not logged in" : "Failed to load wishlist");
        setWishlistItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // -------------------------
  // Cross-tab sync
  // -------------------------
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "wishlist-updated") {
        (async () => {
          try {
            const { data } = await api.get("/wishlist");
            setWishlistItems(data || []);
          } catch (err) {
            console.warn("Wishlist refresh failed:", err);
          }
        })();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // -------------------------
  // Helpers
  // -------------------------
  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlistItems.some((p) => getId(p) === productId);
  };

  // -------------------------
  // Toggle wishlist (optimistic)
  // -------------------------
  const toggleWishlist = async (product) => {
    const productId = getId(product);
    if (!productId) throw new Error("Invalid product");

    const currentlyIn = isInWishlist(productId);
    const willBeIn = !currentlyIn;

    // optimistic update
    setWishlistItems((prev) => {
      if (!willBeIn) {
        return prev.filter((p) => getId(p) !== productId);
      }
      const exists = prev.some((p) => getId(p) === productId);
      if (exists) return prev;
      return [...prev, product];
    });

    try {
      const { data } = await api.post("/wishlist", { productId });

      // If server disagrees, refetch canonical state
      if (typeof data?.inWishlist === "boolean" && data.inWishlist !== willBeIn) {
        const { data: fresh } = await api.get("/wishlist");
        setWishlistItems(fresh || []);
        localStorage.setItem("wishlist-updated", Date.now().toString());
        return data.inWishlist;
      }

      localStorage.setItem("wishlist-updated", Date.now().toString());
      return willBeIn;
    } catch (err) {
      // rollback safely by refetching canonical state
      try {
        const { data: fresh } = await api.get("/wishlist");
        setWishlistItems(fresh || []);
      } catch {
        // ignore
      }
      throw err;
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistLoading: loading,
        wishlistError: error,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
