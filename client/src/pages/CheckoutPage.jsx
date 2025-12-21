// client/src/pages/CheckoutPage.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { CartContext } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import api from "../api/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { normalizeMediaUrl } from "../utils/media";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import ConfirmModal from "../components/ConfirmModal";
import { toast } from "react-hot-toast";

export default function CheckoutPage() {
const { cart, fetchCart, appliedCoupon, clearCoupon } =
  useContext(CartContext);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();




  // Incoming product support (?product=ID&qty=N)
  const incomingProductId = searchParams.get("product");
  const incomingQty = Number(searchParams.get("qty") || 1);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(null);
  const [addressesLoaded, setAddressesLoaded] = useState(false); // tried loading flag

  // Shipping form
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  });

  const [checkoutItems, setCheckoutItems] = useState(cart.items || []);
  const [loading, setLoading] = useState(false);
  const [incomingLoading, setIncomingLoading] = useState(false);
  const [error, setError] = useState(null);

  // Confirm modal logic (returns a Promise)
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    resolve: null,
    loading: false,
  });

  const confirm = (message) =>
    new Promise((resolve) => {
      setConfirmState({ open: true, message, resolve, loading: false });
    });

  const onConfirm = () => {
    if (confirmState.resolve) confirmState.resolve(true);
    setConfirmState({
      open: false,
      message: "",
      resolve: null,
      loading: false,
    });
  };

  const onCancel = () => {
    if (confirmState.resolve) confirmState.resolve(false);
    setConfirmState({
      open: false,
      message: "",
      resolve: null,
      loading: false,
    });
  };

  // Sync cart → checkoutItems (only if checkoutItems empty)
  useEffect(() => {
    if (!checkoutItems.length) setCheckoutItems(cart.items || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // Load saved addresses from AuthContext / backend (no blinking)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (addressesLoaded) return; // already attempted

    const existing = user?.addresses;
    if (Array.isArray(existing) && existing.length > 0) {
      setSavedAddresses(existing);
      setAddressesLoaded(true);
      return;
    }

    const load = async () => {
      try {
        setAddressesLoading(true);
        const { data } = await api.get("/auth/profile");
        if (setUser) setUser((prev) => ({ ...(prev || {}), ...data }));
        setSavedAddresses(data.addresses || []);
      } catch (err) {
        console.error("Failed to load profile addresses", err);
        // don't surface toast here — non-critical
      } finally {
        setAddressesLoading(false);
        setAddressesLoaded(true);
      }
    };

    load();
  }, [user, addressesLoaded, setUser]);

  // Auto-select default address (or first)
  useEffect(() => {
    if (!savedAddresses.length) return;

    let idx = savedAddresses.findIndex((a) => a.isDefault);
    if (idx === -1) idx = 0;

    setSelectedAddressIdx(idx);
    const chosen = savedAddresses[idx];

    setAddress({
      fullName: chosen.fullName || "",
      phone: chosen.phone || "",
      addressLine1: chosen.addressLine1 || "",
      addressLine2: chosen.addressLine2 || "",
      city: chosen.city || "",
      state: chosen.state || "",
      country: chosen.country || "India",
      postalCode: chosen.postalCode || "",
    });
  }, [savedAddresses]);

  // Handle incoming product (Buy Now)
  useEffect(() => {
    if (!incomingProductId) return;

    const load = async () => {
      try {
        setIncomingLoading(true);

        // Try server-side cart update first (preferred)
        try {
          const createPromise = api.post("/cart", {
            productId: incomingProductId,
            qty: incomingQty,
          });
          await toast.promise(createPromise, {
            loading: "Adding to cart…",
            success: "Added to cart",
            error: "Failed to add to cart",
          });
          await fetchCart();
          setCheckoutItems(
            cart.items && cart.items.length ? [...cart.items] : (prev) => prev
          );
          toast.success("Added to checkout");
          return;
        } catch {
          // fallback to local merge
        }

        // Local merge fallback (fetch product then merge)
        const { data } = await toast.promise(
          api.get(`/products/${incomingProductId}`),
          {
            loading: "Loading product…",
            success: "Product loaded",
            error: "Failed to load product",
          }
        );

        const prod = data.product || data;
        setCheckoutItems((prev) => {
          const list = [...(prev || [])];
          const idx = list.findIndex((i) => i.product?._id === prod._id);
          if (idx >= 0) {
            list[idx] = {
              ...list[idx],
              qty: (list[idx].qty || 0) + incomingQty,
            };
            return list;
          }
          return [
            { product: prod, qty: incomingQty, price: prod.price },
            ...list,
          ];
        });

        toast.success("Product added to checkout");
      } catch (err) {
        console.error(err);
        setError("Failed to load product.");
        toast.error("Failed to load product.");
      } finally {
        setIncomingLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingProductId, incomingQty, fetchCart]);

  // INR format
  const fmt = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(v);

  // Totals
  const totals = useMemo(() => {
    const itemsPrice = (checkoutItems || []).reduce((s, it) => {
      const price = it.price ?? it.product?.price ?? 0;
      return s + price * it.qty;
    }, 0);

    const tax = +(itemsPrice * 0.05).toFixed(2);
    const shipping = itemsPrice > 500 || itemsPrice === 0 ? 0 : 50;
    const discount = appliedCoupon?.discount || 0;
    const total = +(itemsPrice + tax + shipping - discount).toFixed(2);

    return { itemsPrice, tax, shipping, discount, total };
  }, [checkoutItems, appliedCoupon]);

  // Place order (Razorpay)
  const placeOrder = async () => {
    setError(null);

    const missing =
      !address.fullName ||
      !address.addressLine1 ||
      !address.city ||
      !address.postalCode;

    if (missing) {
      setError("Please fill required fields (name, address, city, PIN).");
      toast.error("Please fill required fields (name, address, city, PIN).");
      return;
    }

    if (!checkoutItems || checkoutItems.length === 0) {
      setError("Your cart is empty.");
      toast.error("Your cart is empty.");
      return;
    }

    const ok = await confirm(
      `Proceed to pay ${fmt(totals.total)} securely via Razorpay?`
    );
    if (!ok) return;

    try {
      setLoading(true);

      const scriptLoaded = await toast.promise(loadRazorpayScript(), {
        loading: "Loading payment gateway…",
        success: "Ready for payment",
        error: "Unable to load payment gateway",
      });

      if (!scriptLoaded) {
        setError("Unable to load Razorpay. Check your connection.");
        toast.error("Unable to load Razorpay. Check your connection.");
        setLoading(false);
        return;
      }

      // 1) Ask backend to create Razorpay order + our Order
      const createRes = await toast.promise(
        api.post("/payment/razorpay/create-from-cart", {
          shippingAddress: address,
          couponCode: appliedCoupon?.code || null,
        }),
        {
          loading: "Preparing payment…",
          success: "Payment initialized",
          error: (err) =>
            err?.response?.data?.message ||
            "Failed to init payment. Please try again.",
        }
      );

      const data = createRes?.data || {};
      if (!data?.success) {
        const msg =
          data?.message || "Failed to init payment. Please try again.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const options = {
        key: data.razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: "Scentiva",
        description: "Order Payment",
        order_id: data.razorpayOrderId,
        handler: async function (response) {
          try {
            // 2) Verify payment with backend
            const verifyRes = await toast.promise(
              api.post("/payment/razorpay/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: data.orderId,
              }),
              {
                loading: "Verifying payment…",
                success: "Payment verified",
                error: "Payment verification failed",
              }
            );

            if (verifyRes?.data?.success) {
              toast.success("Payment successful!");
clearCoupon();

              await fetchCart();
              // navigate to order success using returned order or data.orderId
              const orderId =
                verifyRes.data.order?._id ||
                verifyRes.data.orderId ||
                data.orderId;
              if (orderId) {
                navigate(`/order-success/${orderId}`);
              } else {
                navigate("/orders");
              }
            } else {
              const msg =
                verifyRes?.data?.message || "Payment verification failed.";
              setError(msg);
              toast.error(msg);
            }
          } catch (err) {
            console.error("Verification failed:", err);
            setError("Payment verification failed.");
            toast.error("Payment verification failed.");
          }
        },
        prefill: {
          name: address.fullName,
          email: user?.email || "",
          contact: address.phone || "",
        },
        theme: {
          color: "#f97316",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay init error:", err);
      setError("Unable to initiate payment.");
      toast.error("Unable to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  const updateQty = (pid, q) => {
    const val = Math.max(1, Number(q) || 1);
    setCheckoutItems((prev) =>
      (prev || []).map((i) => (i.product._id === pid ? { ...i, qty: val } : i))
    );
  };

  const removeItem = (pid) => {
    setCheckoutItems((prev) =>
      (prev || []).filter((i) => i.product._id !== pid)
    );
  };

  // When user clicks a saved address card
  const handleUseAddress = (addr, idx) => {
    setSelectedAddressIdx(idx);
    setAddress({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      state: addr.state || "",
      country: addr.country || "India",
      postalCode: addr.postalCode || "",
    });
  };

  return (
    <>
      <ConfirmModal
        open={confirmState.open}
        title="Confirm"
        message={confirmState.message}
        confirmLabel="Proceed"
        cancelLabel="Cancel"
        loading={confirmState.loading}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      <div className="py-10">
        <div className="max-w-screen-2xl mx-auto px-6">
          <h2
            className="text-3xl font-semibold mb-4"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#6B492E",
            }}
          >
            Checkout
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT SIDE */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft">
              <h3 className="text-xl mb-3 font-medium">Shipping Address</h3>

              {/* Saved addresses list */}
              {addressesLoading && (
                <p className="text-sm text-gray-500 mb-3">
                  Loading saved addresses…
                </p>
              )}

              {!addressesLoading && savedAddresses.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Choose a saved address:
                  </p>
                  <div className="space-y-2">
                    {savedAddresses.map((addr, idx) => (
                      <button
                        key={addr._id || idx}
                        type="button"
                        onClick={() => handleUseAddress(addr, idx)}
                        className={`w-full text-left border rounded-lg p-3 text-sm flex justify-between gap-3 ${
                          selectedAddressIdx === idx
                            ? "border-flame bg-cream/40"
                            : "border-gray-200 hover:bg-cream/20"
                        }`}
                      >
                        <div>
                          <div className="font-medium">
                            {addr.fullName || "No name"}{" "}
                            {addr.isDefault && (
                              <span className="ml-2 text-xs text-green-600">
                                Default
                              </span>
                            )}
                          </div>
                          <div>{addr.addressLine1}</div>
                          {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                          <div>
                            {addr.city}, {addr.state} {addr.postalCode}
                          </div>
                          <div>{addr.country}</div>
                          {addr.phone && (
                            <div className="text-gray-500">📞 {addr.phone}</div>
                          )}
                        </div>
                        <div className="text-xs text-flame self-start">
                          Use this
                        </div>
                      </button>
                    ))}
                  </div>

                  <hr className="my-4" />
                </div>
              )}

              {/* Manual address form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-textmuted">Full Name</span>
                  <input
                    value={address.fullName}
                    onChange={(e) =>
                      setAddress({ ...address, fullName: e.target.value })
                    }
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-flame/30"
                    placeholder="Full name"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-textmuted">Phone</span>
                  <input
                    value={address.phone}
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value })
                    }
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-flame/30"
                    placeholder="Phone (optional)"
                  />
                </label>

                <label className="sm:col-span-2 block">
                  <span className="text-sm text-textmuted">Address line 1</span>
                  <input
                    value={address.addressLine1}
                    onChange={(e) =>
                      setAddress({ ...address, addressLine1: e.target.value })
                    }
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-flame/30"
                    placeholder="House / street"
                  />
                </label>

                <label className="sm:col-span-2 block">
                  <span className="text-sm text-textmuted">
                    Address line 2 (optional)
                  </span>
                  <input
                    value={address.addressLine2}
                    onChange={(e) =>
                      setAddress({ ...address, addressLine2: e.target.value })
                    }
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-flame/30"
                    placeholder="Area, landmark, etc."
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-textmuted">City</span>
                  <input
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-flame/30"
                    placeholder="City"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-textmuted">State</span>
                  <input
                    value={address.state}
                    onChange={(e) =>
                      setAddress({ ...address, state: e.target.value })
                    }
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-flame/30"
                    placeholder="State"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-textmuted">
                    Postal code / PIN
                  </span>
                  <input
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress({ ...address, postalCode: e.target.value })
                    }
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-flame/30"
                    placeholder="PIN"
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-textmuted">Country</span>
                  <input
                    value={address.country}
                    onChange={(e) =>
                      setAddress({ ...address, country: e.target.value })
                    }
                    className="mt-1 w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-flame/30"
                    placeholder="Country"
                  />
                </label>
              </div>

              <hr className="my-6" />

              <h3 className="text-xl mb-3 font-medium">Payment</h3>
              <p className="text-sm text-gray-600 mb-2">
                All payments are processed securely via Razorpay (UPI, Card,
                NetBanking).
              </p>

              <button
                onClick={placeOrder}
                disabled={loading}
                className="btn-primary mt-3"
              >
                {loading ? "Processing..." : `Pay Now — ${fmt(totals.total)}`}
              </button>
            </div>

            {/* RIGHT SIDE */}
            <aside className="bg-white p-6 rounded-2xl shadow-soft">
              <h3 className="text-xl font-medium mb-4">Order Summary</h3>

              {incomingLoading && (
                <div className="text-sm text-gray-500">Loading product…</div>
              )}

              <div className="space-y-4 max-h-80 overflow-auto">
                {(checkoutItems || []).map((it) => {
                  const p = it.product || {};
                  {
                    /* const raw =
                    p.images?.[0]?.url || p.images?.[0]?.filename || p.images?.[0]?.path || null; */
                  }

                  return (
                    <div key={p._id} className="flex items-center gap-3">
                      <img
                        src={
                          normalizeMediaUrl(p.images?.[0]) || "/placeholder.png"
                        }
                        alt={p.title}
                        className="w-14 h-14 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                      />

                      <div className="flex-1">
                        <div className="font-medium">{p.title}</div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          Qty:
                          <input
                            type="number"
                            value={it.qty}
                            min="1"
                            className="border px-2 py-1 w-16 rounded"
                            onChange={(e) =>
                              updateQty(p._id, Number(e.target.value))
                            }
                          />
                          <button
                            className="text-red-500 text-xs"
                            onClick={() => removeItem(p._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="font-semibold">
                        {fmt(it.qty * (it.price ?? p.price ?? 0))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t mt-4 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span>
                  <span>{fmt(totals.itemsPrice)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tax (5%)</span>
                  <span>{fmt(totals.tax)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {totals.shipping === 0 ? "Free" : fmt(totals.shipping)}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-700">
                    <span>
                      Coupon{" "}
                      <span className="font-mono">({appliedCoupon.code})</span>
                    </span>
                    <span>-{fmt(appliedCoupon.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total</span>
                  <span>{fmt(totals.total)}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
