import React, { createContext, useState, useEffect } from "react";
import api from "../api/api";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // --------------------------------
  // Local cart state (safe hydrate)
  // --------------------------------
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || { items: [] };
    } catch {
      return { items: [] };
    }
  });

  // --------------------------------
  // Sync helper (state + storage)
  // --------------------------------
  const updateCart = (data) => {
    setCart(data);
    try {
      localStorage.setItem("cart", JSON.stringify(data));
      localStorage.setItem("cart-updated", Date.now().toString());
    } catch {
      // ignore storage errors
    }
  };

  // --------------------------------
  // Fetch cart from server
  // --------------------------------
  const fetchCart = async () => {
    try {
      const { data } = await api.get("/cart");
      updateCart(data);
    } catch (err) {
      console.warn("Cart fetch failed", err);
      // IMPORTANT:
      // Do NOT wipe local cart on auth/network failure
    }
  };

  // Initial load
  useEffect(() => {
    fetchCart();
  }, []);

  // Cross-tab cart sync
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "cart-updated") {
        fetchCart();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // --------------------------------
  // ADD TO CART (logic only)
  // --------------------------------
  const addToCart = async (productId, qty = 1) => {
    try {
      const { data } = await api.post("/cart", {
        productId,
        qty: Number(qty) || 1,
      });
      updateCart(data);
      return data;
    } catch (err) {
      console.error("Add to cart failed", err);
      throw new Error(
        err?.response?.data?.message || "Unable to add item to cart"
      );
    }
  };

  // --------------------------------
  // REMOVE FROM CART (logic only)
  // --------------------------------
  const removeFromCart = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      updateCart(data);
      return data;
    } catch (err) {
      console.error("Remove from cart failed", err);
      throw new Error(
        err?.response?.data?.message || "Unable to remove item from cart"
      );
    }
  };

  // --------------------------------
  // CONTEXT PROVIDER
  // --------------------------------
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
