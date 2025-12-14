// client/src/admin/AdminDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import ProductForm from "./ProductForm";
import OrderList from "./OrderList";
import NewsletterList from "./NewsletterList";
import {
  FiBox,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiHome,
  FiChevronRight,
  FiMail,
  FiPlus,
  FiLayers,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import ConfirmModal from "../../components/ConfirmModal"; // adjust if your path differs
import clsx from "clsx";

/**
 * Redesigned AdminDashboard
 *
 * - Absolute sidebar links to avoid relative concatenation (/admin/...)
 * - Top overview cards + quick action buttons
 * - Improved mobile slide-in sidebar and accessible controls
 * - Routes inside remain relative (products, orders, newsletter)
 */

export default function AdminDashboard() {
  const [open, setOpen] = useState(false); // mobile sidebar
  const location = useLocation();
  const navigate = useNavigate();

  const mobileRef = useRef(null);
  const toggleButtonRef = useRef(null);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState(null);

  // Close mobile sidebar on route change and restore focus to toggle
  useEffect(() => {
    setOpen(false);
    if (toggleButtonRef.current) toggleButtonRef.current.focus();

    // show small toast with section name (friendly)
    const parts = location.pathname.split("/").filter(Boolean);
    const current = parts.length ? parts[parts.length - 1] : "dashboard";
    // don't flood toasts on every route change — short and subtle
    toast.dismiss();
    toast.success(`Opened: ${current}`, { duration: 1200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Click-outside & Escape handling for mobile sidebar
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onClick = (e) => {
      if (!open) return;
      if (
        mobileRef.current &&
        !mobileRef.current.contains(e.target) &&
        !e.target.closest("[data-admin-toggle]")
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Confirm modal helpers
  const openConfirm = (info) => {
    setConfirmInfo(info);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmInfo(null);
  };

  const handleConfirm = () => {
    if (!confirmInfo) {
      closeConfirm();
      return;
    }

    if (confirmInfo?.action === "closeMenu") {
      setOpen(false);
      toast("Menu closed");
    }

    closeConfirm();
  };

  // Quick actions
  const handleQuickCreateProduct = () => {
    // navigate to product create route
    navigate("/admin/products");
    // optionally open a create modal in ProductForm — here we show a toast
    toast.success("Open product create form");
  };

  const handleQuickOrders = () => {
    navigate("/admin/orders");
  };

  // Simple responsive card data — you can replace with real stats fetch
  const cards = [
    {
      id: "products",
      title: "Products",
      subtitle: "Create & manage products",
      icon: <FiBox />,
      to: "/admin/products",
      action: handleQuickCreateProduct,
    },
    {
      id: "orders",
      title: "Orders",
      subtitle: "View & update orders",
      icon: <FiShoppingBag />,
      to: "/admin/orders",
      action: handleQuickOrders,
    },
    {
      id: "newsletter",
      title: "Newsletter",
      subtitle: "Manage subscribers",
      icon: <FiMail />,
      to: "/admin/newsletter",
      action: () => navigate("/admin/newsletter"),
    },
  ];

  // Helper for active nav style
  const adminLinkClass = ({ isActive }) =>
    clsx(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition",
      isActive
        ? "bg-gradient-to-r from-wax to-flame text-white shadow"
        : "text-gray-700 hover:bg-gray-50"
    );

  return (
    <div className="min-h-screen bg-[var(--bg-soft,#fff9f5)] w-full">
      <div className="md:flex md:items-start">
        {/* SIDEBAR */}
        <aside
          className={clsx(
            "bg-white border-r z-40 transform transition-transform duration-300",
            open ? "fixed inset-y-0 left-0 w-72" : "-translate-x-full md:translate-x-0 md:w-72 md:static"
          )}
          ref={mobileRef}
          aria-hidden={!open && "true"}
        >
          <div className="p-4 border-b flex items-center justify-between md:justify-start gap-4">
            <div className="hidden md:flex items-center gap-3">
              <FiHome className="text-wax" />
              <h2 className="text-lg font-semibold" style={{ color: "#8B5E3C" }}>
                Admin Panel
              </h2>
            </div>

            {/* mobile close */}
            <button
              className="md:hidden ml-auto p-2 rounded hover:bg-gray-100"
              onClick={() => openConfirm({ action: "closeMenu" })}
              aria-label="Close menu"
            >
              <FiX size={20} />
            </button>
          </div>

          <nav className="p-4 space-y-3">
            <div className="mb-2 px-1 text-xs uppercase text-gray-400">Manage</div>

            <NavLink to="/admin/products" className={adminLinkClass}>
              <FiBox /> <span>Products</span>
            </NavLink>

            <NavLink to="/admin/orders" className={adminLinkClass}>
              <FiShoppingBag /> <span>Orders</span>
            </NavLink>

            <NavLink to="/admin/newsletter" className={adminLinkClass}>
              <FiMail /> <span>Newsletter</span>
            </NavLink>

            <div className="mt-4 border-t pt-3">
              <div className="px-1 text-xs uppercase text-gray-400 mb-2">Quick actions</div>
              <button
                onClick={handleQuickCreateProduct}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 text-sm"
              >
                <FiPlus /> Add product
              </button>
              <button
                onClick={handleQuickOrders}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 text-sm mt-2"
              >
                <FiLayers /> View orders
              </button>
            </div>
          </nav>

          {/* optional quick admin footer */}
          <div className="mt-auto p-4 border-t text-sm text-gray-500">
            <div>Signed in as <strong>Admin</strong></div>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex-1 w-full">
          {/* Mobile top bar */}
          <header className="md:hidden flex items-center justify-between bg-white p-4 border-b">
            <button
              onClick={() => setOpen(true)}
              data-admin-toggle
              ref={toggleButtonRef}
              aria-label="Open menu"
              className="p-2 rounded hover:bg-gray-100"
            >
              <FiMenu size={20} />
            </button>
            <div className="text-lg font-semibold" style={{ color: "#8B5E3C" }}>
              Admin Dashboard
            </div>
            <div className="w-6" />
          </header>

          {/* Content wrapper — full width, inner padding keeps spacing from edges */}
          <main className="p-6">
            <div className="w-full px-6">
              {/* TOP HEADER / OVERVIEW */}
              <div className="mb-6 flex flex-col lg:flex-row items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold" style={{ color: "#8B5E3C" }}>
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Overview and quick actions for store management.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQuickCreateProduct}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-wax text-white hover:brightness-95"
                  >
                    <FiPlus /> New product
                  </button>
                  <button
                    onClick={() => navigate("/admin/orders")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded border"
                  >
                    View orders
                  </button>
                </div>
              </div>

              {/* CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {cards.map((c) => (
                  <article
                    key={c.id}
                    className="bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => navigate(c.to)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && navigate(c.to)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-md flex items-center justify-center bg-gradient-to-br from-wax to-flame text-white">
                          {c.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{c.title}</div>
                          <div className="text-xs text-gray-500">{c.subtitle}</div>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            c.action();
                          }}
                          className="text-xs px-3 py-1 rounded bg-flame text-white"
                        >
                          Go
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* MAIN PANEL (white card with routes) */}
              <div className="bg-white p-6 rounded-lg shadow">
                <Routes>
                  <Route path="products" element={<ProductForm />} />
                  <Route path="orders" element={<OrderList />} />
                  <Route path="newsletter" element={<NewsletterList />} />

                  <Route
                    index
                    element={
                      <div className="text-center text-gray-600 py-20">
                        <h3 className="text-xl font-semibold" style={{ color: "#8B5E3C" }}>
                          Welcome to Admin
                        </h3>
                        <p className="mt-3">Select a section from the left, or use the quick actions above.</p>
                      </div>
                    }
                  />
                </Routes>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ConfirmModal used for mobile menu close */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmInfo?.action === "closeMenu" ? "Close menu" : "Confirm"}
        message={confirmInfo?.action === "closeMenu" ? "Are you sure you want to close the menu?" : "Are you sure?"}
        confirmLabel={confirmInfo?.action === "closeMenu" ? "Close" : "Confirm"}
        cancelLabel="Cancel"
        loading={false}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
