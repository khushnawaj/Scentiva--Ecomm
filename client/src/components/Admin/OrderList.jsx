// client/src/pages/admin/OrderList.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../../api/api";
import ConfirmModal from "../ConfirmModal";
import { normalizeMediaUrl } from "../../utils/media";
import { toast } from "react-hot-toast";

import {
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null); // {orderId, newStatus, oldStatus}
  const debounceRef = useRef(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/orders/myorders");
      setOrders(data || []);
    } catch (err) {
      console.error("Order load error", err);
      setOrders([]);
      toast.error(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {}, 300);
    return () => clearTimeout(debounceRef.current);
  }, [keyword]);

  const filteredOrders = orders.filter((o) => {
    const key = keyword.trim().toLowerCase();
    if (!key) return true;
    return (
      (o._id || "").toLowerCase().includes(key) ||
      (o.user?.email || "").toLowerCase().includes(key)
    );
  });

  const badgeClass = (status) => {
    const base = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case "pending":
        return base + " bg-yellow-100 text-yellow-700";
      case "processing":
        return base + " bg-blue-100 text-blue-700";
      case "shipped":
        return base + " bg-indigo-100 text-indigo-700";
      case "delivered":
        return base + " bg-green-100 text-green-700";
      case "cancelled":
        return base + " bg-red-100 text-red-700";
      default:
        return base + " bg-gray-100 text-gray-700";
    }
  };

  // Step 1: ask for confirmation
  const promptStatusChange = (orderId, newStatus, oldStatus) => {
    setPending({ orderId, newStatus, oldStatus });
    setConfirmOpen(true);
  };

  // Step 2: confirmed -> do optimistic update + fallback
  const confirmStatusUpdate = async () => {
    if (!pending) return;

    const { orderId, newStatus, oldStatus } = pending;

    setUpdatingId(orderId);
    setConfirmOpen(false);

    // optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? {
              ...o,
              status: newStatus,
              deliveredAt:
                newStatus === "delivered"
                  ? new Date().toISOString()
                  : o.deliveredAt,
            }
          : o
      )
    );

    try {
      const op = api.put(`/orders/${orderId}/status`, { status: newStatus });

      await toast.promise(op, {
        loading: "Updating order status...",
        success: "Order status updated",
        error: (err) => err?.response?.data?.message || "Failed to update order status",
      });
    } catch (err) {
      console.error("Failed to update order status", err);

      // rollback
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: oldStatus } : o))
      );

      toast.error(err?.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdatingId(null);
      setPending(null);
    }
  };

  return (
    <div>
      <h2
        className="text-2xl font-semibold mb-6"
        style={{ fontFamily: "'Playfair Display', serif", color: "#6B492E" }}
      >
        Orders
      </h2>

      {/* Search */}
      <div className="flex items-center mb-6">
        <div className="border flex items-center px-3 py-2 rounded-lg w-full max-w-xs bg-white shadow-sm">
          <FiSearch className="text-gray-400" />
          <input
            placeholder="Search orders by ID or email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="ml-2 w-full outline-none text-sm"
          />
        </div>

        <button
          onClick={() => setKeyword("")}
          className="ml-3 px-3 py-2 rounded-md bg-flame text-white text-sm hover:brightness-95"
        >
          Clear
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredOrders.length === 0 && (
        <div className="text-center bg-white p-6 shadow rounded text-gray-600">
          No orders found.
        </div>
      )}

      {/* Orders */}
      <div className="space-y-4">
        {!loading &&
          filteredOrders.map((o) => (
            <div
              key={o._id}
              className="bg-white rounded-2xl shadow-soft border p-0 overflow-hidden"
            >
              {/* Summary */}
              <button
                type="button"
                onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-cream/40"
              >
                <div className="flex-1">
                  <div className="text-sm text-gray-500">
                    Order ID: <span className="font-medium">{o._id}</span>
                  </div>

                  <div
                    className="text-2xl font-semibold mt-1"
                    style={{ color: "#8B5E3C" }}
                  >
                    ₹{Number(o.totalPrice || 0).toLocaleString("en-IN")}
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <span className={badgeClass(o.status)}>{o.status}</span>

                    {o.isPaid ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs">
                        <FiCheckCircle /> Paid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs">
                        <FiXCircle /> Unpaid
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-4 text-gray-500 flex items-center gap-2">
                  {/* status select */}
                  <select
                    className="border rounded px-2 py-1 text-xs bg-white"
                    value={o.status}
                    disabled={updatingId === o._id}
                    onChange={(e) =>
                      promptStatusChange(o._id, e.target.value, o.status)
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>

                  {expanded === o._id ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </button>

              {/* Expanded details */}
              {expanded === o._id && (
                <div className="border-t bg-gray-50 p-4 text-sm">
                  <div className="mb-3 grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Placed on</div>
                      <div className="font-medium">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                      </div>

                      {o.status === "delivered" && o.deliveredAt && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">Delivered on</div>
                          <div className="font-medium text-green-700">
                            {new Date(o.deliveredAt).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Customer</div>
                      <div className="text-gray-700">
                        {o.user?.name || o.shippingAddress?.fullName || "—"}
                      </div>
                      <div className="text-xs text-gray-500">{o.user?.email || "No email"}</div>

                      <div className="mt-3">
                        <div className="text-xs text-gray-500">Shipping to</div>
                        <div className="text-gray-700">
                          {o.shippingAddress?.fullName}
                          <br />
                          {o.shippingAddress?.addressLine1}
                          {o.shippingAddress?.addressLine2 && (
                            <>
                              <br />
                              {o.shippingAddress?.addressLine2}
                            </>
                          )}
                          <br />
                          {o.shippingAddress?.city}, {o.shippingAddress?.state} {o.shippingAddress?.postalCode}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Payment</div>
                      <div className="font-medium">{o.paymentMethod || "N/A"}</div>
                      <div className="text-xs text-gray-500">
                        {o.isPaid
                          ? `Paid${o.paidAt ? " on " + new Date(o.paidAt).toLocaleString() : ""}`
                          : "Not paid"}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <div className="font-medium mb-2">Items</div>
                    <ul className="space-y-3">
                      {o.orderItems?.map((item, idx) => (
                        <li key={item.product || idx} className="flex items-center gap-3">
                          <img
                            src={normalizeMediaUrl(item.image) || "/placeholder.png"}
                            alt={item.title}
                            className="w-14 h-14 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.png";
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-textmuted">{item.title}</div>
                            <div className="text-xs text-gray-600">Qty: {item.qty} × ₹{item.price}</div>
                          </div>
                          <div className="font-medium">₹{(item.qty * item.price).toLocaleString("en-IN")}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Confirm status change"
        message={pending ? `Do you want to change the status to "${pending.newStatus}"?` : ""}
        confirmLabel="Yes, change"
        cancelLabel="Cancel"
        loading={updatingId === pending?.orderId}
        onCancel={() => {
          setConfirmOpen(false);
          setPending(null);
        }}
        onConfirm={confirmStatusUpdate}
      />
    </div>
  );
}
