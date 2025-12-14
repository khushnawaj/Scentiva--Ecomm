// client/src/pages/Login.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiLogIn, FiGithub, FiMail } from "react-icons/fi";
import { toast } from "react-hot-toast";

/**
 * Themed Login page for Scentiva
 * - preserves AuthContext.login usage and navigation behavior
 * - warm / cozy theme using Tailwind tokens (wax, flame, cream, perfume)
 * - accessible labels, toast-only feedback, social placeholders
 */

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Pass `remember` into login — your AuthContext can decide how to persist session.
      await toast.promise(
        login(email.trim().toLowerCase(), password, remember),
        {
          loading: "Signing you in...",
          success: "Signed in successfully",
          error: (err) => err?.response?.data?.message || err?.message || "Failed to login",
        }
      );

      // on success, navigate
      navigate("/");
    } catch (err) {
      console.error("Login failed", err);
      // toast.promise already displayed error; keep console for debugging
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card-cosset p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-wax to-flame text-white shadow">
              <FiLogIn />
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#8B5E3C" }}>
                Welcome back
              </h1>
              <p className="text-sm text-gray-600">Sign in to access your orders and wishlist</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4" aria-label="Login form">
            <label className="block">
              <span className="text-sm font-medium text-textmuted">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@Scentiva.com"
                className="mt-1 block w-full border border-cream/60 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-flame/40 focus:border-flame"
                aria-label="Email address"
              />
            </label>

            <label className="block relative">
              <span className="text-sm font-medium text-textmuted">Password</span>
              <div className="mt-1 flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 border border-cream/60 px-3 py-2 rounded-l focus:outline-none focus:ring-2 focus:ring-flame/40 focus:border-flame"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="bg-gray-50 border-l px-3 py-2 rounded-r hover:bg-gray-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-textmuted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-flame"
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-flame hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-white ${loading ? "bg-gray-400" : "btn-primary"}`}
              aria-disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Social / alt login */}
          <div className="my-4 flex items-center gap-3">
            <hr className="flex-1 border-gray-200" />
            <div className="text-xs text-gray-400">or continue with</div>
            <hr className="flex-1 border-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toast("GitHub login placeholder", { icon: "🔗" })}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
              aria-label="Sign in with GitHub"
            >
              <FiGithub /> GitHub
            </button>

            <button
              onClick={() => toast("Email magic link placeholder", { icon: "✉️" })}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
              aria-label="Sign in with Email"
            >
              <FiMail /> Email
            </button>
          </div>

          <p className="text-sm text-center text-gray-600 mt-4">
            Don’t have an account?{" "}
            <Link to="/register" className="text-flame font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
