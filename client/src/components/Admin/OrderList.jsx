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
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const debounceRef = useRef(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/orders", {
        params: { page, limit: 10, keyword },
      });
      setOrders(data.orders || []);
      setPages(data.pages || 1);
    } catch (err) {
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, keyword]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchOrders();
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [keyword]);

  useEffect(() => {
    setExpanded(null);
  }, [orders]);

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

  const promptStatusChange = (orderId, newStatus, oldStatus) => {
    setPending({ orderId, newStatus, oldStatus });
    setConfirmOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!pending) return;
    const { orderId, newStatus, oldStatus } = pending;

    setUpdatingId(orderId);
    setConfirmOpen(false);

    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: newStatus } : o
      )
    );

    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success("Order status updated");
    } catch {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status: oldStatus } : o
        )
      );
      toast.error("Failed to update order status");
    } finally {
      setUpdatingId(null);
      setPending(null);
    }
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-[#6B492E]">
        Orders
      </h2>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex items-center border rounded-lg px-3 py-2 bg-white w-full sm:max-w-sm">
          <FiSearch className="text-gray-400" />
          <input
            placeholder="Search by order id / email"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="ml-2 w-full outline-none text-sm"
          />
        </div>
        {keyword && (
          <button
            onClick={() => setKeyword("")}
            className="text-sm px-3 py-2 rounded bg-gray-100"
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Orders */}
      {!loading &&
        orders.map((o) => (
          <div
            key={o._id}
            className="bg-white rounded-xl border shadow-sm mb-4 overflow-hidden"
          >
            {/* Summary */}
            <button
              type="button"
              onClick={() => setExpanded(expanded === o._id ? null : o._id)}
              className="w-full p-4 text-left hover:bg-gray-50"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 break-all">
                    Order ID: <span className="font-medium">{o._id}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-semibold text-[#8B5E3C] mt-1">
                    ₹{Number(o.totalPrice || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
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

                <div className="flex items-center gap-2 justify-end">
                  <select
                    value={o.status}
                    disabled={updatingId === o._id}
                    onChange={(e) =>
                      promptStatusChange(o._id, e.target.value, o.status)
                    }
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="pending">pending</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                  {expanded === o._id ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>
            </button>

            {/* Details */}
            {expanded === o._id && (
              <div className="border-t bg-gray-50 p-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500">Placed on</div>
                    <div className="font-medium">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Customer</div>
                    <div>{o.user?.name || "—"}</div>
                    <div className="text-xs text-gray-500">
                      {o.user?.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Payment</div>
                    <div>{o.paymentMethod || "N/A"}</div>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Items</div>
                  <ul className="space-y-3">
                    {o.orderItems?.map((item, idx) => (
                      <li
                        key={item.product || idx}
                        className="flex items-start sm:items-center gap-3"
                      >
                        <img
                          src={
                            normalizeMediaUrl(item.image) ||
                            "/placeholder.png"
                          }
                          className="w-14 h-14 object-cover rounded-lg"
                          alt={item.title}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs text-gray-600">
                            Qty: {item.qty} × ₹{item.price}
                          </div>
                        </div>
                        <div className="font-medium">
                          ₹{(item.qty * item.price).toLocaleString("en-IN")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {pages}
          </span>
          <button
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        title="Confirm status change"
        message={
          pending
            ? `Change order status to "${pending.newStatus}"?`
            : ""
        }
        confirmLabel="Yes"
        cancelLabel="Cancel"
        loading={updatingId === pending?.orderId}
        onConfirm={confirmStatusUpdate}
        onCancel={() => {
          setConfirmOpen(false);
          setPending(null);
        }}
      />
    </div>
  );
}
