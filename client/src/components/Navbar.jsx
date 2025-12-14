// client/src/components/Navbar.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import {
  FiShoppingCart,
  FiMenu,
  FiX,
  FiSearch,
  FiUser,
  FiGift,
  FiHeart,
} from "react-icons/fi";
import clsx from "clsx";
import { normalizeMediaUrl } from "../utils/media";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounceRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileRef = useRef(null);
  const searchRef = useRef(null);

  // badge animation state
  const [cartPulse, setCartPulse] = useState(false);
  const [wishPulse, setWishPulse] = useState(false);
  const prevCartRef = useRef(0);
  const prevWishRef = useRef(0);

  const cartCount = (cart?.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
  const wishlistCount = (wishlistItems || []).length;

  // Debounced search: navigate after typing stops
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = query.trim();
      if (q.length > 0) {
        navigate(`/products?keyword=${encodeURIComponent(q)}`);
      }
    }, 420);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, navigate]);

  // Enter key triggers immediate search
  const onSearchKey = (e) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const q = query.trim();
      if (q.length > 0) navigate(`/products?keyword=${encodeURIComponent(q)}`);
      else navigate("/products");
    }
  };

  // Click-outside & Escape to close menus
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };

    const onDocClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (
        mobileRef.current &&
        !mobileRef.current.contains(e.target) &&
        !e.target.closest("[data-mobile-toggle]")
      ) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, []);

  // lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout(); // AuthContext already toasts on logout
    setUserMenuOpen(false);
    navigate("/");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : null;

  // compute avatar src (normalizeMediaUrl) and fallback
  const avatarSrc = user?.avatar ? normalizeMediaUrl(user.avatar, { typeHint: "image" }) : null;

  // Pulse when counts change (subtle UX)
  useEffect(() => {
    const prev = prevCartRef.current || 0;
    if (cartCount !== prev) {
      setCartPulse(true);
      const t = setTimeout(() => setCartPulse(false), 450);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  useEffect(() => {
    const prev = prevWishRef.current || 0;
    if (wishlistCount !== prev) {
      setWishPulse(true);
      const t = setTimeout(() => setWishPulse(false), 450);
      return () => clearTimeout(t);
    }
  }, [wishlistCount]);

  // keep prev refs up-to-date after render
  useEffect(() => {
    prevCartRef.current = cartCount;
    prevWishRef.current = wishlistCount;
  }, [cartCount, wishlistCount]);

  return (
    <header className="w-full sticky top-0 z-50">
      {/* Top promo stripe */}
      <div className="w-full bg-gradient-to-r from-wax to-cream text-white text-sm">
        <div className="w-full px-4 lg:px-8 py-1 text-center font-medium">
          Free gift wrap on orders over <strong>₹999</strong> — use{" "}
          <span className="font-bold">GIFT10</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="w-full bg-white shadow-sm">
        <div className="w-full flex items-center justify-between px-4 lg:px-8 py-4">
          {/* Left: mobile toggle + brand */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
              onClick={() => setMobileOpen((s) => !s)}
              aria-label="Open menu"
              data-mobile-toggle
            >
              {mobileOpen ? <FiX /> : <FiMenu />}
            </button>

            <Link to="/" className="flex items-center gap-3" aria-label="Scentiva home">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-wax to-flame text-white shadow">
                <FiGift size={20} />
              </div>
              <div className="leading-4">
                <div
                  className="text-lg font-semibold"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#8B5E3C",
                  }}
                >
                  Scentiva
                </div>
                <div className="text-xs text-gray-500 -mt-1">
                  candles • perfumes • gifts
                </div>
              </div>
            </Link>
          </div>

          {/* Center: search (desktop) */}
          <div className="hidden md:flex flex-1 justify-center px-8">
            <div className="w-full max-w-2xl">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  aria-label="Search products"
                  placeholder="Search candles, scents, gift-wrap, brands..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKey}
                  className="w-full border px-12 py-2 rounded-full shadow-sm focus:ring-2 focus:ring-flame/30 focus:border-flame"
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => {
                      setQuery("");
                      navigate("/products");
                      searchRef.current?.focus();
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: links, cart, user */}
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="hidden md:inline-block text-sm text-wax hover:text-flame"
            >
              Shop
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50"
              aria-label={`Open wishlist, ${wishlistCount} items`}
            >
              <FiHeart size={18} />
              <span className="hidden md:inline text-sm text-gray-700">Wishlist</span>

              {/* badge with pulse */}
              {wishlistCount > 0 && (
                <span
                  className={clsx(
                    "absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs text-white bg-red-500 rounded-full",
                    wishPulse && "animate-pulse"
                  )}
                  aria-live="polite"
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <FiShoppingCart size={18} />
              <span className="hidden md:inline text-sm text-gray-700">Cart</span>

              {/* badge with pulse */}
              {cartCount > 0 && (
                <span
                  className={clsx(
                    "absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs text-white bg-red-500 rounded-full",
                    cartPulse && "animate-pulse"
                  )}
                  aria-live="polite"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth area */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((s) => !s)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-gray-50"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="User menu"
                >
                  {/* Avatar (preferred) -> initials -> icon */}
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={user.name || "avatar"}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png";
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-perfume/20 text-perfume font-semibold">
                      {initials || <FiUser />}
                    </div>
                  )}

                  <span className="hidden md:inline text-sm text-gray-700">
                    {user.name.split(" ")[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-md shadow-md py-2 z-50">
                    {/* profile header */}
                    <div className="px-4 py-3 border-b">
                      <div className="flex items-center gap-3">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={user.name || "avatar"}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-perfume/20 text-perfume font-semibold">
                            {initials || <FiUser />}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm text-gray-800">
                            {user.name}
                          </div>
                          {user.email && (
                            <div className="text-xs text-gray-500 truncate max-w-[12rem]">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="text-sm text-gray-700 hover:text-flame">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-3 py-1 bg-flame text-white rounded-md hover:brightness-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile slide-in panel */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={mobileRef}
              className="absolute left-0 top-0 bottom-0 w-80 bg-white p-4 overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-wax to-flame text-white flex items-center justify-center shadow">
                    CL
                  </div>
                  <span className="font-bold">Scentiva</span>
                </Link>
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <FiX />
                </button>
              </div>

              <nav className="space-y-2">
                <Link
                  to="/products"
                  className="block px-2 py-2 rounded hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Shop
                </Link>

                {/* Mobile Wishlist */}
                <Link
                  to="/wishlist"
                  className="block px-2 py-2 rounded hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-[1.4rem] px-1.5 py-0.5 text-[11px] font-semibold text-white bg-red-500 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/#categories"
                  className="block px-2 py-2 rounded hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Categories
                </Link>

                <Link
                  to="/cart"
                  className="block px-2 py-2 rounded hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Cart ({cartCount})
                </Link>

                {user ? (
                  <>
                    <Link
                      to="/profile"
                      className="block px-2 py-2 rounded hover:bg-gray-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-2 py-2 rounded hover:bg-gray-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Orders
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        className="block px-2 py-2 rounded hover:bg-gray-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="w-full text-left px-2 py-2 text-red-600 rounded hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-2 py-2 rounded hover:bg-gray-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-2 py-2 rounded hover:bg-gray-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Register
                    </Link>
                  </>
                )}

                <div className="pt-4 border-t mt-4">
                  <div className="text-sm text-gray-600 mb-2">Quick search</div>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      aria-label="Mobile search"
                      placeholder="Search products..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onSearchKey}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Hit enter or wait — results will appear on Products.
                  </div>
                </div>
              </nav>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
