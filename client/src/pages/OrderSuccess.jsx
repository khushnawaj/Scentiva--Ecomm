// src/pages/OrderSuccess.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import { normalizeMediaUrl } from "../utils/media";
import { toast } from "react-hot-toast";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // retry payment state
  const [retryLoading, setRetryLoading] = useState(false);

  const fmt = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(v);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/orders/${id}`);
        if (!mounted) return;
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order", err);
        if (!mounted) return;
        setError("Unable to load order details.");
        toast.error(
          err?.response?.data?.message || "Unable to load order details."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (id) load();
    else {
      setLoading(false);
      setError("No order id provided.");
      toast.error("No order id provided.");
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  // Retry payment handler
  const handleRetryPayment = async () => {
    if (!id) return;
    setRetryLoading(true);

    // show a persistent loading toast that we dismiss/replace later
    const loadingToastId = toast.loading("Creating payment session...");

    try {
      // Create a new payment session/intent and return a URL or checkout id for redirect.
      const { data } = await api.post(`/orders/${id}/retry-payment`);

      // Accept common response shapes:
      // { paymentUrl: 'https://...', redirectUrl: '...', checkoutId: 'abc123' }
      if (data?.paymentUrl) {
        toast.dismiss(loadingToastId);
        toast.success("Redirecting to payment...");
        window.location.href = data.paymentUrl;
        return;
      }

      if (data?.redirectUrl) {
        toast.dismiss(loadingToastId);
        toast.success("Redirecting to payment...");
        window.location.href = data.redirectUrl;
        return;
      }

      if (data?.checkoutId) {
        toast.dismiss(loadingToastId);
        toast.success("Opening checkout...");
        window.location.href = `/checkout/${data.checkoutId}`;
        return;
      }

      // If backend returns the full order with a payment object:
      if (data?.payment?.url) {
        toast.dismiss(loadingToastId);
        toast.success("Redirecting to payment...");
        window.location.href = data.payment.url;
        return;
      }

      // Nothing we can use — show helpful message
      console.warn("Retry payment response:", data);
      toast.dismiss(loadingToastId);
      toast.error(
        "Payment session could not be created. Please contact support."
      );
    } catch (err) {
      console.error("Retry payment failed:", err);
      toast.dismiss(loadingToastId);
      const backendMsg = err?.response?.data?.message || err?.message;
      toast.error(
        backendMsg ||
          "Failed to initiate payment. Please try again or contact support."
      );
    } finally {
      setRetryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-10">
        <div className="max-w-screen-md mx-auto px-6">
          <div className="bg-white rounded-2xl p-6 shadow-soft">
            <p className="text-sm text-gray-600">Loading order details…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-10">
        <div className="max-w-screen-md mx-auto px-6">
          <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
            <p className="text-red-600 mb-4">{error || "Order not found."}</p>
            <Link to="/products" className="btn-primary inline-block">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shipping = order?.shippingAddress ?? {};
  const items = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const createdAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN")
    : "";

  const statusKey = (order?.status || "pending").toString().toLowerCase();
  const statusInfo = (key) => {
    switch (key) {
      case "paid":
      case "completed":
      case "success":
        return {
          emoji: "✅",
          label: "Paid",
          classes:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800",
          message: "Payment received. Your order will be processed shortly.",
        };
      case "processing":
        return {
          emoji: "⏳",
          label: "Processing",
          classes:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800",
          message: "We are preparing your order.",
        };
      case "pending":
        return {
          emoji: "🕒",
          label: "Pending",
          classes:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800",
          message: "Payment is pending or confirmation is awaited.",
        };
      case "failed":
      case "payment_failed":
        return {
          emoji: "❌",
          label: "Payment failed",
          classes:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800",
          message:
            order?.paymentResult?.message ||
            "Payment failed. You can retry payment or contact support.",
        };
      case "cancelled":
      case "canceled":
        return {
          emoji: "🛑",
          label: "Cancelled",
          classes:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800",
          message: "This order was cancelled.",
        };
      case "refunded":
        return {
          emoji: "💸",
          label: "Refunded",
          classes:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800",
          message: "This order has been refunded.",
        };
      default:
        return {
          emoji: "📦",
          label: key,
          classes:
            "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800",
          message: "",
        };
    }
  };

  const s = statusInfo(statusKey);

  return (
    <div className="py-10">
      <div className="max-w-screen-md mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-soft text-center">
          <h2
            className="text-3xl font-semibold mb-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#6B492E",
            }}
          >
            Thank you for your order!
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            {statusKey === "failed" || statusKey === "payment_failed"
              ? "There was an issue with your payment."
              : "Your order has been received."}
          </p>

          <div className="flex justify-center items-center gap-3 mt-2">
            <span className={s.classes}>
              <span className="text-sm">{s.emoji}</span>
              <span className="text-sm font-medium">{s.label}</span>
            </span>
            <span className="text-xs text-gray-500">
              Order ID: <span className="font-mono">{order._id}</span> •{" "}
              {createdAt}
            </span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/orders" className="btn-primary">
              View all orders
            </Link>
            <Link
              to="/products"
              className="px-4 py-2 rounded-lg border text-sm hover:bg-cream/40"
            >
              Continue shopping
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-lg font-medium mb-2">Order summary</h3>

          <div className="space-y-3 max-h-64 overflow-auto pr-2">
            {items.length === 0 && (
              <div className="text-sm text-gray-500">
                No items listed for this order.
              </div>
            )}
            {items.map((item) => {
              const raw =
                item.image?.url ||
                item.image?.path ||
                item.image?.filename ||
                item.image ||
                null;

              const img = normalizeMediaUrl(raw) || "/placeholder.png";
              return (
                <div
                  key={item.product || item.title}
                  className="flex items-center gap-3 text-sm"
                >
                  <img
                    src={img}
                    alt={item.title}
                    className="w-12 h-12 rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {item.title ?? "Untitled"}
                    </div>
                    <div className="text-gray-500">
                      Qty: {item.qty ?? 1} • {fmt(item.price ?? 0)}
                    </div>
                  </div>
                  <div className="font-semibold">
                    {fmt((item.qty ?? 1) * (item.price ?? 0))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-3 text-sm space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Items</span>
              <span>{fmt(order.itemsPrice ?? 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{fmt(order.taxPrice ?? 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>
                {order.shippingPrice === 0
                  ? "Free"
                  : fmt(order.shippingPrice ?? 0)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total</span>
              <span>{fmt(order.totalPrice ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* Shipping details + status + retry */}
        <div className="bg-white rounded-2xl p-6 shadow-soft text-sm space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Shipping address</h3>
            <div className="text-gray-700">
              <div>{shipping?.fullName ?? "Name not available"}</div>
              {shipping?.phone && <div>📞 {shipping.phone}</div>}
              <div>
                {shipping?.addressLine1 ??
                  shipping?.address ??
                  "Address not available"}
              </div>
              {shipping?.addressLine2 && <div>{shipping.addressLine2}</div>}
              <div>
                {shipping?.city ?? ""}
                {shipping?.city && shipping?.state ? ", " : ""}
                {shipping?.state ?? ""} {shipping?.postalCode ?? ""}
              </div>
              <div>{shipping?.country ?? ""}</div>
            </div>
          </div>

          <div>
            <div className="mt-3 text-xs text-gray-500">
              <div>
                Status:{" "}
                <span className="font-medium capitalize">
                  {order.status ?? "pending"}
                </span>
              </div>
              {s.message && (
                <div className="mt-1 text-sm text-gray-600">{s.message}</div>
              )}
              {order?.paymentResult?.status && (
                <div className="mt-2 text-xs text-gray-500">
                  Payment gateway status:{" "}
                  <span className="font-medium">
                    {order.paymentResult.status}
                  </span>
                  {order.paymentResult?.message && (
                    <>
                      {" "}
                      — <span>{order.paymentResult.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Retry button shown only for failed payments */}
            {(statusKey === "failed" || statusKey === "payment_failed") && (
              <div className="mt-4 flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={handleRetryPayment}
                  disabled={retryLoading}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {retryLoading ? "Preparing payment…" : "Retry payment"}
                </button>

                <Link
                  to="/orders"
                  className="px-4 py-2 rounded-lg border text-sm"
                >
                  View orders
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
