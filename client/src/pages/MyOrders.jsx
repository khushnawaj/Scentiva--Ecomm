// src/pages/MyOrders.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filter state
  const [statusFilter, setStatusFilter] = useState(""); // "" = all

  const fmt = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(v);

  // core loader used by effect and retry button
  const fetchOrders = useCallback(
    async (opts = { showToasts: false }) => {
      // opts.showToasts: if true, use toast.promise wrapper outside; otherwise just run normally
      try {
        setLoading(true);
        setError(null);

        // Build query params for backend (if your backend supports status filtering)
        // If backend doesn't support status filter, we filter client-side below.
        const params = {};
        if (statusFilter) params.status = statusFilter;

        const { data } = await api.get("/orders/myorders", { params });
        // Ensure array
        const arr = Array.isArray(data) ? data : data?.orders || [];
        // If backend did not filter, apply client-side filter
        const filtered = statusFilter
          ? arr.filter((o) => (o.status || "").toString().toLowerCase() === statusFilter.toString().toLowerCase())
          : arr;

        setOrders(filtered);
        return filtered;
      } catch (err) {
        console.error("Failed to load orders", err);
        // map 401 to friendly message
        if (err?.response?.status === 401) {
          const msg = "Please log in to view your orders.";
          setError(msg);
          throw new Error(msg);
        } else {
          const msg = err?.response?.data?.message || "Unable to load your orders.";
          setError(msg);
          throw new Error(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  // initial load + reload on statusFilter change
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await fetchOrders();
      } catch (err) {
        // error already handled inside fetchOrders (setError). Also show toast for immediate feedback:
        if (mounted) toast.error(err?.message || "Unable to load orders.");
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [fetchOrders]);

  // Retry handler uses toast.promise
  const handleRetry = async () => {
    const promise = fetchOrders();
    toast.promise(
      promise,
      {
        loading: "Retrying to load your orders...",
        success: (res) => {
          // res is the returned orders array
          if (!res || (Array.isArray(res) && res.length === 0)) {
            // user-friendly hint when empty result
            return "No orders found";
          }
          return "Orders reloaded";
        },
        error: (err) => err?.message || "Failed to reload orders",
      },
      // small options to make toast.promise non-intrusive
      {}
    );
  };

  // Manual refresh (when orders present)
  const handleRefresh = async () => {
    const promise = fetchOrders();
    toast.promise(
      promise,
      {
        loading: "Refreshing orders...",
        success: (res) => {
          if (!res || (Array.isArray(res) && res.length === 0)) {
            return "No orders found";
          }
          return "Orders refreshed";
        },
        error: (err) => err?.message || "Failed to refresh orders",
      }
    );
  };

  // handle status filter change
  const onStatusChange = (val) => {
    setStatusFilter(val);
    // fetchOrders will be triggered by useEffect because fetchOrders depends on statusFilter
    // but also show a subtle toast if the filter results in no orders after load completes
    // We'll rely on the useEffect + fetchOrders to set orders; then in that promise we can show toast.
    // To keep UX immediate, show a tiny toast indicating filtering in progress.
    toast.loading("Filtering orders...", { id: "orders-filter" });
    // remove it after fetchOrders completes (we don't await here)
    fetchOrders()
      .then((res) => {
        toast.dismiss("orders-filter");
        if (!res || res.length === 0) {
          toast("No orders match that filter", { icon: "🕵️" });
        } else {
          toast.success("Filter applied");
        }
      })
      .catch((err) => {
        toast.dismiss("orders-filter");
        toast.error(err?.message || "Failed to apply filter");
      });
  };

  return (
    <div className="py-10">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-3xl font-semibold"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#6B492E",
            }}
          >
            My Orders
          </h2>

          <div className="flex items-center gap-3">
            {/* Status filter */}
            <select
              aria-label="Filter orders by status"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="border px-3 py-2 rounded bg-white"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="px-3 py-2 rounded border text-sm hover:bg-cream/40"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <p className="text-sm text-gray-600">Loading your orders…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
            <p className="text-red-600 mb-4">{error}</p>
            {error.includes("log in") && (
              <Link to="/login" className="btn-primary inline-block">
                Go to Login
              </Link>
            )}
            <div className="mt-4">
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-lg bg-flame text-white"
                disabled={loading}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
            <p className="mb-4 text-gray-700">You haven't placed any orders yet.</p>
            <Link to="/products" className="btn-primary inline-block">
              Start shopping
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const createdAt = order.createdAt
                ? new Date(order.createdAt).toLocaleString("en-IN")
                : "";
              return (
                <Link
                  key={order._id}
                  to={`/order-success/${order._id}`}
                  className="block bg-white rounded-2xl p-4 shadow-soft hover:bg-cream/40 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm text-gray-500">
                        Order ID: <span className="font-mono">{order._id}</span>
                      </div>
                      <div className="text-xs text-gray-400">{createdAt}</div>
                      <div className="text-xs mt-1 text-gray-600">
                        {order.orderItems?.length ?? 0} items •{" "}
                        <span className="font-medium capitalize">{order.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{fmt(order.totalPrice || 0)}</div>
                      <div className="text-xs text-flame mt-1">View details →</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
