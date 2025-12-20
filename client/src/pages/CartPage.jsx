import React, {
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { CartContext } from "../contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiTag,
  FiX,
  FiInfo,
} from "react-icons/fi";
import { normalizeMediaUrl } from "../utils/media";
import ConfirmModal from "../components/ConfirmModal";
import api from "../api/api";
import { toast } from "react-hot-toast";

export default function CartPage() {
  const { cart = { items: [] }, addToCart, removeFromCart } =
    useContext(CartContext);
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  /* ---------------- Coupon State ---------------- */
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  /* ---------------- Fetch Public Coupons ---------------- */
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setCouponsLoading(true);
        const { data } = await api.get("/coupons/public");
        setAvailableCoupons(data || []);
      } catch (err) {
        console.error("Failed to load coupons");
      } finally {
        setCouponsLoading(false);
      }
    };
    loadCoupons();
  }, []);

  /* ---------------- Confirm Modal ---------------- */
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    resolve: null,
  });

  const confirm = (message) =>
    new Promise((resolve) =>
      setConfirmState({ open: true, message, resolve })
    );

  const onConfirm = () => {
    confirmState.resolve?.(true);
    setConfirmState({ open: false, message: "", resolve: null });
  };

  const onCancel = () => {
    confirmState.resolve?.(false);
    setConfirmState({ open: false, message: "", resolve: null });
  };

  /* ---------------- INR Formatter ---------------- */
  const fmt = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(v);

  /* ---------------- Totals ---------------- */
  const totals = useMemo(() => {
    const itemsPrice = (cart.items || []).reduce((acc, it) => {
      const price = it.price ?? it.product?.price ?? 0;
      return acc + price * it.qty;
    }, 0);

    const tax = +(itemsPrice * 0.05).toFixed(2);
    const shipping = itemsPrice > 500 || itemsPrice === 0 ? 0 : 50;
    const discount = couponPreview?.discount || 0;
    const total = +(itemsPrice + tax + shipping - discount).toFixed(2);

    return { itemsPrice, tax, shipping, discount, total };
  }, [cart, couponPreview]);

  /* ---------------- Apply Coupon ---------------- */
  const applyCoupon = async (codeOverride) => {
    const codeToApply = (codeOverride || couponCode).trim();
    if (!codeToApply) return;

    try {
      setCouponLoading(true);
      setCouponMessage(null);

      const { data } = await api.post("/coupons/apply", {
        code: codeToApply,
      });

      setCouponPreview(data);
      setCouponCode(data.code);

      setCouponMessage({
        type: "success",
        text: `Coupon applied. You saved ${fmt(data.discount)} 🎉`,
      });

      toast.success(`Coupon ${data.code} applied`);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid or expired coupon";
      setCouponPreview(null);
      setCouponMessage({ type: "error", text: msg });
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponPreview(null);
    setCouponCode("");
    setCouponMessage(null);
    toast.success("Coupon removed");
  };

  /* ---------------- Quantity + Remove ---------------- */
  const updateQty = async (pid, qty) => {
    if (qty < 1) return;
    setUpdatingId(pid);
    try {
      await toast.promise(addToCart(pid, qty), {
        loading: "Updating quantity…",
        success: "Quantity updated",
        error: "Unable to update quantity",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (pid) => {
    const ok = await confirm("Remove this item from your cart?");
    if (!ok) return;

    setUpdatingId(pid);
    try {
      await toast.promise(removeFromCart(pid), {
        loading: "Removing item…",
        success: "Item removed",
        error: "Unable to remove item",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---------------- Empty Cart ---------------- */
  if (!cart.items || cart.items.length === 0) {
    return (
      <>
        <ConfirmModal
          open={confirmState.open}
          message={confirmState.message}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
        <div className="py-10 px-4 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-wax mb-6">
            Your Cart
          </h2>
          <div className="bg-white card-cosset p-8 rounded-2xl">
            <p className="text-gray-700 mb-6">
              Your cart is currently empty.
            </p>
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <>
      <ConfirmModal
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />

      <div className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold mb-6 text-wax">
            Your Cart
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ITEMS */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((it) => {
                const p = it.product || {};
                const imgSrc =
                  normalizeMediaUrl(p.images?.[0]) ||
                  "/placeholder.png";

                return (
                  <div
                    key={p._id}
                    className="bg-white card-cosset rounded-2xl p-4 flex gap-4"
                  >
                    <img
                      src={imgSrc}
                      alt={p.title}
                      className="w-28 h-28 object-cover rounded-md"
                    />

                    <div className="flex-1">
                      <Link
                        to={`/product/${p._id}`}
                        className="font-medium text-wax text-lg hover:underline"
                      >
                        {p.title}
                      </Link>

                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 bg-cream/60 rounded-md p-1">
                          <button
                            onClick={() =>
                              updateQty(p._id, it.qty - 1)
                            }
                            disabled={it.qty <= 1}
                            className="p-2 border rounded"
                          >
                            <FiMinus />
                          </button>
                          <span className="px-3">{it.qty}</span>
                          <button
                            onClick={() =>
                              updateQty(p._id, it.qty + 1)
                            }
                            className="p-2 border rounded"
                          >
                            <FiPlus />
                          </button>
                        </div>

                        <div className="flex items-center gap-4">
                          <strong>
                            {fmt(
                              (it.price ?? p.price ?? 0) *
                                it.qty
                            )}
                          </strong>
                          <button
                            onClick={() => handleRemove(p._id)}
                            className="text-red-600"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SUMMARY */}
            <aside className="bg-white card-cosset rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">
                Order summary
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span>{fmt(totals.itemsPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>{fmt(totals.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {totals.shipping === 0
                      ? "Free"
                      : fmt(totals.shipping)}
                  </span>
                </div>

                {/* Coupon Input */}
                {!couponPreview && (
                  <div className="mt-3">
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(
                            e.target.value.toUpperCase()
                          )
                        }
                        placeholder="Have a coupon?"
                        className="flex-1 border px-3 py-2 rounded text-sm"
                      />
                      <button
                        onClick={() => applyCoupon()}
                        disabled={couponLoading}
                        className="border px-3 rounded"
                      >
                        <FiTag />
                      </button>
                    </div>

                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <FiInfo />
                      Coupon terms apply. Min order & expiry may vary.
                    </div>
                  </div>
                )}

                {/* HORIZONTAL COUPON CAROUSEL */}
                {!couponPreview &&
                  !couponsLoading &&
                  availableCoupons.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        Available offers
                      </div>

                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {availableCoupons.map((c) => (
                          <div
                            key={c._id}
                            className="min-w-[220px] max-w-[220px] border border-dashed border-gray-300 rounded-lg p-3 flex-shrink-0 hover:bg-cream/30 transition"
                          >
                            <div className="font-mono text-xs bg-cream/70 px-2 py-0.5 rounded inline-block mb-1">
                              {c.code}
                            </div>

                            <div className="text-sm font-medium text-gray-800">
                              Save {c.discountPercent}%
                              {c.maxDiscount > 0 && (
                                <span className="text-xs text-gray-500">
                                  {" "}
                                  (up to ₹{c.maxDiscount})
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 mt-1">
                              {c.description ||
                                `Valid on orders above ₹${c.minOrderValue || 0}`}
                            </div>

                            <button
                              onClick={() => applyCoupon(c.code)}
                              className="mt-3 text-wax text-xs font-medium hover:underline"
                            >
                              Apply →
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="text-[11px] text-gray-500 mt-1">
                        Swipe to see more offers
                      </div>
                    </div>
                  )}

                {/* Applied Coupon */}
                {couponPreview && (
                  <div className="mt-3 flex justify-between items-center text-green-700">
                    <span>
                      Coupon <strong>{couponPreview.code}</strong>
                    </span>
                    <button onClick={removeCoupon}>
                      <FiX />
                    </button>
                  </div>
                )}

                {/* Feedback */}
                {couponMessage && (
                  <div
                    className={`text-xs mt-2 ${
                      couponMessage.type === "success"
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {couponMessage.text}
                  </div>
                )}

                {couponPreview && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span>-{fmt(totals.discount)}</span>
                  </div>
                )}

                <div className="border-t my-3" />

                <div className="flex justify-between items-center font-bold text-xl text-wax">
                  <span>Total</span>
                  <span>{fmt(totals.total)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate("/checkout")}
                  className="btn-primary w-full"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/products"
                  className="block text-center text-sm text-gray-700 hover:underline"
                >
                  Continue shopping
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
