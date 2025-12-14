// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useRef } from "react";
import api from "../api/api";
import { toast } from "react-hot-toast";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const mountedRef = useRef(true);

  // Safe local load
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch {
      return null;
    }
  });

  // Inject token into axios automatically
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Sync to localStorage
  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("auth-updated", Date.now().toString());
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.setItem("auth-updated", Date.now().toString());
    }
  }, [user, token]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "auth-updated") {
        const newUser = JSON.parse(localStorage.getItem("user") || "null");
        const newToken = localStorage.getItem("token") || null;
        setUser(newUser);
        setToken(newToken);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ------------------------
  // LOGIN
  // ------------------------
  const login = async (email, password) => {
    return toast.promise(
      (async () => {
        try {
          const { data } = await api.post("/auth/login", { email, password });

          const userObj = {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            addresses: data.addresses || []
          };

          setUser(userObj);
          setToken(data.token);

          return `Welcome back, ${data.name.split(" ")[0]}!`;
        } catch (err) {
          console.error("Login failed", err);
          throw new Error(
            err?.response?.data?.message || "Login failed. Please try again."
          );
        }
      })(),
      {
        loading: "Signing in…",
        success: (msg) => msg,
        error: (err) => err.message || "Login failed",
      }
    );
  };

  // ------------------------
  // REGISTER
  // ------------------------
  const register = async (name, email, password) => {
    return toast.promise(
      (async () => {
        try {
          const { data } = await api.post("/auth/register", {
            name,
            email,
            password,
          });

          const userObj = {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            addresses: data.addresses || []
          };

          setUser(userObj);
          setToken(data.token);

          return "Account created successfully!";
        } catch (err) {
          console.error("Registration failed", err);
          throw new Error(
            err?.response?.data?.message ||
              "Unable to create your account. Try again."
          );
        }
      })(),
      {
        loading: "Creating account…",
        success: (msg) => msg,
        error: (err) => err.message || "Registration failed",
      }
    );
  };

  // ------------------------
  // LOGOUT
  // ------------------------
  const logout = () => {
    toast.success("You have been logged out.");
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.setItem("auth-updated", Date.now().toString());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
