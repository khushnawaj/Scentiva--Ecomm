// src/contexts/WishlistContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import api from "../api/api";
import { toast } from "react-hot-toast";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]); // full products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // helper to get id
  const getId = (p) => (typeof p === "string" ? p : p?._id || p?.id);

  // initial load
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/wishlist"); // assume returns array of products
        if (!mountedRef.current) return;
        setWishlistItems(data || []);
      } catch (err) {
        console.warn("Wishlist initial load failed:", err);
        if (!mountedRef.current) return;
        setError(err?.response?.status === 401 ? "Not logged in" : "Failed to load wishlist");
        setWishlistItems([]);
        // surface friendly toast for failures (but don't spam on 401)
        if (err?.response?.status !== 401) toast.error("Failed to load wishlist");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen for cross-tab updates (simple approach)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "wishlist-updated") {
        // re-fetch wishlist from server to ensure canonical state
        (async () => {
          try {
            const { data } = await api.get("/wishlist");
            setWishlistItems(data || []);
          } catch (err) {
            console.warn("Failed to refresh wishlist after storage event:", err);
          }
        })();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlistItems.some((p) => getId(p) === productId);
  };

  // Optimistic toggle: update local state first, call API, rollback on error
  const toggleWishlist = async (product) => {
    const productId = getId(product);
    if (!productId) {
      console.warn("toggleWishlist: no productId", product);
      return false;
    }

    const currentlyIn = isInWishlist(productId);
    const willBeIn = !currentlyIn;

    // optimistic local update
    setWishlistItems((prev) => {
      if (!willBeIn) {
        return prev.filter((p) => getId(p) !== productId);
      } else {
        // if full product provided, use it; otherwise add a minimal object
        const exists = prev.some((p) => getId(p) === productId);
        if (exists) return prev;
        const itemToAdd = typeof product === "object" && product !== null ? product : { _id: productId };
        return [...prev, itemToAdd];
      }
    });

    try {
      const { data } = await api.post("/wishlist", { productId });
      // server returns something like { inWishlist: boolean } — if server disagrees, reconcile
      const serverIn = data?.inWishlist;
      if (typeof serverIn === "boolean" && serverIn !== willBeIn) {
        // reconcile to server truth (refetch)
        try {
          const { data: fresh } = await api.get("/wishlist");
          setWishlistItems(fresh || []);
        } catch (e) {
          console.warn("Failed to re-fetch wishlist after server mismatch:", e);
        }
        // notify other tabs
        try {
          localStorage.setItem("wishlist-updated", Date.now().toString());
        } catch {}
        return Boolean(serverIn);
      }

      // success: emit event so other tabs refresh if needed
      try {
        localStorage.setItem("wishlist-updated", Date.now().toString());
      } catch {}
      return willBeIn;
    } catch (err) {
      // rollback optimistic change
      setWishlistItems((prev) => {
        if (willBeIn) {
          return prev.filter((p) => getId(p) !== productId);
        } else {
          // was removed optimistically — re-fetch to restore canonical state
          (async () => {
            try {
              const { data: fresh } = await api.get("/wishlist");
              setWishlistItems(fresh || []);
            } catch (e) {
              console.warn("Failed to re-fetch wishlist after toggle error:", e);
            }
          })();
          return prev;
        }
      });

      console.error("toggleWishlist error:", err);

      // show friendly toasts instead of alerts
      if (err?.response?.status === 401) {
        toast.error("Please login to use wishlist");
      } else {
        toast.error("Failed to update wishlist. Please try again.");
      }

      // rethrow so callers can react (they might be using toast.promise)
      throw err;
    }
  };

  const value = {
    wishlistItems,
    wishlistLoading: loading,
    wishlistError: error,
    isInWishlist,
    toggleWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
