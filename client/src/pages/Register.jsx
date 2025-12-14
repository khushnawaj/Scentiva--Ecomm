// client/src/pages/Register.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff, FiUser, FiGithub, FiMail } from "react-icons/fi";
import { toast } from "react-hot-toast";

/**
 * Scentiva - Register Page
 * - Warm themed styling using Tailwind tokens (flame, wax, cream, perfume)
 * - Fixed email regex
 * - Password strength hint
 * - Preserves AuthContext.register API
 */

export default function Register() {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const validate = () => {
    if (!name.trim()) return "Please provide your name.";
    if (!email.trim()) return "Please provide an email address.";
    // correct email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) return "Please enter a valid email.";
    if (password.length < 6) return "Password should be at least 6 characters.";
    if (!acceptTerms) return "Please accept the terms and conditions.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      toast.error(v);
      return;
    }

    try {
      setLoading(true);
      // AuthContext.register(name, email, password)
      await register(name.trim(), email.trim().toLowerCase(), password);

      toast.success("Account created successfully! Redirecting...");
      // Navigate to home (or wherever). toast will persist if your provider is in App.
      navigate("/");
    } catch (err) {
      console.error("Register failed", err);
      const msg = err?.response?.data?.message || err?.message || "Registration failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // lightweight password strength meter
  const passwordStrength = (() => {
    if (password.length === 0) return { label: "", score: 0 };
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const labels = ["Very weak", "Weak", "Okay", "Strong", "Very strong"];
    return { label: labels[score], score };
  })();

  const strengthColorClass =
    passwordStrength.score >= 3 ? "bg-green-500" : passwordStrength.score >= 2 ? "bg-yellow-400" : "bg-red-400";

  // handlers for social/signup placeholders - replaced alert() with toast
  const handleGithubSignup = () => {
    toast("GitHub signup placeholder", { icon: "🔗" });
  };

  const handleEmailMagic = () => {
    toast("Email magic link placeholder", { icon: "✉️" });
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card-cosset p-6">
          <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#6B492E" }}>
            <FiUser className="inline mr-2" /> Create your account
          </h2>
          <p className="text-sm text-textmuted mb-4">Sign up to explore our scented candles, perfumes and curated gifts.</p>

          {error && (
            <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4" aria-label="Register form">
            <label className="block">
              <span className="text-sm font-medium text-textmuted">Full name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-flame/30"
                aria-label="Full name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-textmuted">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-flame/30"
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
                  placeholder="Choose a secure password"
                  className="flex-1 border px-3 py-2 rounded-l focus:outline-none focus:ring-2 focus:ring-flame/30"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="bg-cream border-l px-3 py-2 rounded-r hover:opacity-95"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <div className="text-textmuted">Strength: {passwordStrength.label}</div>
                  <div className="w-28 h-2 bg-gray-200 rounded overflow-hidden ml-3">
                    <div
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      className={`h-full ${strengthColorClass}`}
                    />
                  </div>
                </div>
              )}
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-textmuted">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="accent-flame"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-flame hover:underline">
                  terms & conditions
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-white ${
                loading ? "bg-gray-400" : "btn-primary"
              }`}
              aria-busy={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <hr className="flex-1 border-gray-200" />
            <div className="text-xs text-gray-400">or sign up with</div>
            <hr className="flex-1 border-gray-200" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGithubSignup}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
              aria-label="Sign up with GitHub"
            >
              <FiGithub /> GitHub
            </button>

            <button
              onClick={handleEmailMagic}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
              aria-label="Sign up with Email"
            >
              <FiMail /> Email
            </button>
          </div>

          <p className="text-sm text-center text-textmuted mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-flame hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
