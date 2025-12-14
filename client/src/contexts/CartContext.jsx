// src/contexts/CartContext.jsx
import React, { createContext, useState, useEffect, useRef } from "react";
import api from "../api/api";
import { toast } from "react-hot-toast";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const mountedRef = useRef(true);

  // Load from localStorage safely
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || { items: [] };
    } catch (e) {
      return { items: [] };
    }
  });

  // Sync setter (writes both state + storage + cross-tab event)
  const updateCart = (data) => {
    setCart(data);
    try {
      localStorage.setItem("cart", JSON.stringify(data));
      localStorage.setItem("cart-updated", Date.now().toString());
    } catch {}
  };

  // Fetch cart from server
  const fetchCart = async () => {
    try {
      const { data } = await api.get("/cart");
      updateCart(data);
    } catch (err) {
      console.warn("Cart fetch failed", err);
      updateCart({ items: [] });
    }
  };

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    fetchCart();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen for other tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "cart-updated") fetchCart();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // ---------------------------
  //  ADD TO CART (server-sync)
  // ---------------------------
  const addToCart = async (productId, qty = 1) => {
    return toast.promise(
      (async () => {
        try {
          const { data } = await api.post("/cart", { productId, qty });
          updateCart(data);
          return "Added to cart";
        } catch (err) {
          console.error("Add to cart failed", err);
          throw new Error(
            err?.response?.data?.message || "Unable to add item to cart"
          );
        }
      })(),
      {
        loading: "Updating cart…",
        success: "Added to cart",
        error: (err) => err.message || "Failed to update cart",
      }
    );
  };

  // ---------------------------
  //  REMOVE ITEM
  // ---------------------------
  const removeFromCart = async (productId) => {
    return toast.promise(
      (async () => {
        try {
          const { data } = await api.delete(`/cart/${productId}`);
          updateCart(data);
          return "Item removed";
        } catch (err) {
          console.error("Remove failed", err);
          throw new Error(
            err?.response?.data?.message || "Unable to remove item"
          );
        }
      })(),
      {
        loading: "Removing…",
        success: "Removed from cart",
        error: (err) => err.message || "Failed to remove item",
      }
    );
  };

  // Context Value
  return (
    <CartContext.Provider
      value={{
        cart,
        fetchCart,
        addToCart,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
