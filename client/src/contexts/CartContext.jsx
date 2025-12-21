import React, { createContext, useState, useEffect } from "react";
import api from "../api/api";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // --------------------------------
  // CART STATE (safe hydrate)
  // --------------------------------
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || { items: [] };
    } catch {
      return { items: [] };
    }
  });

  // --------------------------------
  // COUPON STATE (safe hydrate)
  // --------------------------------
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("appliedCoupon"));
    } catch {
      return null;
    }
  });

  // --------------------------------
  // Sync helper
  // --------------------------------
  const updateCart = (data) => {
    setCart(data);
    try {
      localStorage.setItem("cart", JSON.stringify(data));
      localStorage.setItem("cart-updated", Date.now().toString());
    } catch {}
  };

  const updateCoupon = (coupon) => {
    setAppliedCoupon(coupon);
    try {
      if (coupon) {
        localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
      } else {
        localStorage.removeItem("appliedCoupon");
      }
      localStorage.setItem("coupon-updated", Date.now().toString());
    } catch {}
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
    }
  };

  // Initial load
  useEffect(() => {
    fetchCart();
  }, []);

  // --------------------------------
  // Cross-tab sync
  // --------------------------------
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "cart-updated") fetchCart();
      if (e.key === "coupon-updated") {
        try {
          setAppliedCoupon(
            JSON.parse(localStorage.getItem("appliedCoupon"))
          );
        } catch {
          setAppliedCoupon(null);
        }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // --------------------------------
  // CART ACTIONS
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
      throw new Error(
        err?.response?.data?.message || "Unable to add item"
      );
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      updateCart(data);
      return data;
    } catch (err) {
      throw new Error(
        err?.response?.data?.message || "Unable to remove item"
      );
    }
  };

  // --------------------------------
  // COUPON ACTIONS
  // --------------------------------
  const applyCoupon = (coupon) => {
    // expected shape: { code, discount }
    updateCoupon(coupon);
  };

  const clearCoupon = () => {
    updateCoupon(null);
  };

  // --------------------------------
  // PROVIDER
  // --------------------------------
  return (
    <CartContext.Provider
      value={{
        cart,
        appliedCoupon,
        fetchCart,
        addToCart,
        removeFromCart,
        applyCoupon,
        clearCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
