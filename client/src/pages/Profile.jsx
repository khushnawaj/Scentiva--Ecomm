// client/src/pages/Profile.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { FiUser, FiMail, FiCamera, FiLock } from "react-icons/fi";
import api from "../api/api";
import { normalizeMediaUrl } from "../utils/media";
import { toast } from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [addresses, setAddresses] = useState(user?.addresses || []);

  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [passForm, setPassForm] = useState({ oldPassword: "", newPassword: "" });
  const [error] = useState(null); // keep for logic if needed, but not used for UI

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState(null); // { action: 'removeAddress', payload: { idx } }

  // orders state for "Orders" tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  // review modal state
const [reviewModalOpen, setReviewModalOpen] = useState(false);
const [reviewTarget, setReviewTarget] = useState(null); 
// { orderId, productId, productTitle }

const [reviewForm, setReviewForm] = useState({
  rating: 0,
  comment: "",
});


  // sync local state when user changes
  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setAvatarPreview(user?.avatar || null);
    setAddresses(user?.addresses || []);
  }, [user]);

  // fetch fresh profile on mount (if logged in)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !setUser) return;

    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/profile");
        // merge into context user (keep token/other fields)
        setUser((prev) => ({ ...(prev || {}), ...data }));
      } catch (err) {
        console.error("Failed to load profile", err);
        toast.error("Failed to load profile");
      }
    };

    fetchProfile();
  }, [setUser]);

  // fetch orders only when Orders tab is opened
useEffect(() => {
  if (tab !== "orders" || !user) return;

  const loadOrders = async () => {
    setOrdersError(null);
    setOrdersLoading(true);
    try {
      const { data } = await api.get("/orders/myorders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load orders", err);
      setOrdersError(
        err?.response?.data?.message || "Failed to load your orders."
      );
      toast.error(
        err?.response?.data?.message || "Failed to load your orders."
      );
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  loadOrders();
}, [tab, user]);


  // AVATAR UPLOAD (toast.promise)
const uploadAvatar = async (file) => {
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    toast.error("Only image files are allowed");
    return;
  }

  const form = new FormData();
  form.append("avatar", file);

  try {
    const res = await toast.promise(
      api.post("/auth/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
      {
        loading: "Uploading avatar...",
        success: "Avatar updated!",
        error: (err) =>
          err?.response?.data?.message || "Failed to upload avatar",
      }
    );

    const avatarObj = res.data.avatar;

    setAvatarPreview(avatarObj);

    setUser((prev) => ({
      ...(prev ?? user ?? {}),
      avatar: avatarObj,
    }));
  } catch (err) {
    console.error("Avatar upload failed", err);
  }
};


  // SAVE PROFILE (name, email, addresses) with toast.promise
const saveProfile = async (addrOverride = addresses) => {
  if (loading) return;

  setLoading(true);
  try {
    const { data } = await api.put("/auth/profile", {
      name,
      email,
      addresses: addrOverride,
    });

    setUser((prev) => ({
      ...(prev || {}),
      ...data,
      addresses: data.addresses ?? addrOverride,
    }));

    return true;
  } catch (err) {
    console.error("Save profile failed", err);
    toast.error("Failed to save changes");
    return false;
  } finally {
    setLoading(false);
  }
};


  // CHANGE PASSWORD with toast.promise
  const changePassword = async () => {
    setLoading(true);
    try {
      const promise = api.put("/auth/change-password", passForm);

      await toast.promise(promise, {
        loading: "Updating password...",
        success: "Password updated successfully!",
        error: (err) => err?.response?.data?.message || "Password update failed",
      });

      setPassForm({ oldPassword: "", newPassword: "" });
    } catch (err) {
      console.error("Change password failed", err);
    } finally {
      setLoading(false);
    }
  };

  // avatar src with normalizeMediaUrl
  const avatarSrc = avatarPreview
    ? normalizeMediaUrl(avatarPreview, { typeHint: "image" })
    : "/placeholder.png";

  // Confirm modal handlers
  const openConfirm = (action, payload = null) => {
    setConfirmInfo({ action, payload });
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmInfo(null);
  };

  const handleConfirm = async () => {
    if (!confirmInfo) return;
    const { action, payload } = confirmInfo;

  if (action === "removeAddress") {
  const idx = payload?.idx;
  const previous = addresses;
  const updated = addresses.filter((_, i) => i !== idx);

  setAddresses(updated);

  const ok = await saveProfile(updated);
  if (ok) {
    toast.success("Address removed");
  } else {
    setAddresses(previous);
  }
}

 else if (action === "discardChanges") {
      setName(user?.name || "");
      setEmail(user?.email || "");
      setAvatarPreview(user?.avatar || null);
      setAddresses(user?.addresses || []);
      toast("Changes discarded");
    } else {
      console.warn("Unknown confirm action", action);
    }

    closeConfirm();
  };

  // local address helpers
const handleSetDefault = async (idx) => {
  const previous = addresses;
  const updated = addresses.map((a, i) =>
    i === idx ? { ...a, isDefault: true } : { ...a, isDefault: false }
  );

  setAddresses(updated);

  const ok = await saveProfile(updated);
  if (ok) {
    toast.success("Default address updated");
  } else {
    setAddresses(previous);
  }
};


  const handleRemoveAddress = (idx) => {
    openConfirm("removeAddress", { idx });
  };

  const submitReview = async () => {
  if (!reviewTarget || reviewForm.rating === 0) return;

  try {
    await toast.promise(
      api.post("/reviews", {
        orderId: reviewTarget.orderId,
        productId: reviewTarget.productId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      }),
      {
        loading: "Submitting review...",
        success: "Thanks for your review!",
        error: (err) =>
          err?.response?.data?.message || "Failed to submit review",
      }
    );

    // close modal
    setReviewModalOpen(false);

    // mark locally as rated (UI only, no refetch yet)
    setOrders((prev) =>
      prev.map((o) =>
        o._id === reviewTarget.orderId
          ? {
              ...o,
              orderItems: o.orderItems.map((it) =>
                it.product === reviewTarget.productId
                  ? { ...it, isRated: true }
                  : it
              ),
            }
          : o
      )
    );
  } catch (err) {
    console.error("Submit review failed", err);
  }
};


  return (
    <div className="py-10 w-full">
      <div className="w-full max-w-screen-lg mx-auto px-6">
        <h2
          className="text-3xl font-semibold mb-6"
          style={{ fontFamily: "'Playfair Display', serif", color: "#8B5E3C" }}
        >
          My Profile
        </h2>

        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          {["profile", "password", "addresses", "orders"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
              }}
              className={`pb-2 capitalize font-medium transition ${
                tab === t ? "border-b-2 border-flame text-flame" : "text-gray-600 hover:text-gray-800"
              }`}
              aria-pressed={tab === t}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TAB 1 — PROFILE */}
        {tab === "profile" && (
          <div className="bg-white p-6 rounded-2xl card-cosset">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="relative">
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-2 border-cream"
                />
                <label
                  className="absolute bottom-0 right-0 bg-white shadow p-2 rounded-full cursor-pointer flex items-center justify-center"
                  title="Upload avatar"
                >
                  <FiCamera className="text-gray-600" />
<input
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) => {
    uploadAvatar(e.target.files?.[0]);
    e.target.value = "";
  }}
/>

                </label>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-semibold text-wax">{user?.name || "Your name"}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Name</span>
                <div className="flex items-center gap-2 border px-3 py-2 rounded-md mt-1">
                  <FiUser className="text-gray-400" />
                  <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 outline-none" placeholder="Your name" aria-label="Full name" />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <div className="flex items-center gap-2 border px-3 py-2 rounded-md mt-1">
                  <FiMail className="text-gray-400" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 outline-none" placeholder="Email" aria-label="Email" />
                </div>
              </label>

              <div className="flex items-center gap-3 mt-2">
                <button onClick={saveProfile} disabled={loading} className={`btn-primary ${loading ? "opacity-70 pointer-events-none" : ""}`}>
                  {loading ? "Saving..." : "Save changes"}
                </button>

                <button
                  onClick={() => openConfirm("discardChanges")}
                  className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 — CHANGE PASSWORD */}
        {tab === "password" && (
          <div className="bg-white p-6 rounded-2xl card-cosset space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Current password</span>
              <div className="flex items-center gap-2 border px-3 py-2 rounded-md mt-1">
                <FiLock className="text-gray-400" />
                <input
                  type="password"
                  value={passForm.oldPassword}
                  onChange={(e) => setPassForm({ ...passForm, oldPassword: e.target.value })}
                  className="flex-1 outline-none"
                  placeholder="Current password"
                  aria-label="Current password"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">New password</span>
              <div className="flex items-center gap-2 border px-3 py-2 rounded-md mt-1">
                <FiLock className="text-gray-400" />
                <input
                  type="password"
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="flex-1 outline-none"
                  placeholder="New password"
                  aria-label="New password"
                />
              </div>
            </label>

            <div className="flex items-center gap-3">
              <button onClick={changePassword} disabled={loading} className={`btn-primary ${loading ? "opacity-70 pointer-events-none" : ""}`}>
                {loading ? "Updating..." : "Update password"}
              </button>

              <button onClick={() => setPassForm({ oldPassword: "", newPassword: "" })} className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* TAB 3 — ADDRESSES */}
        {tab === "addresses" && (
          <div className="bg-white p-6 rounded-2xl card-cosset text-gray-700">
            <h3 className="font-medium mb-3">Address book</h3>

            {/* Existing addresses */}
            <div className="space-y-3 mb-4 text-sm">
              {(!addresses || addresses.length === 0) && <p className="text-gray-500">No addresses saved yet.</p>}
              {addresses.map((addr, idx) => (
                <div key={addr._id || idx} className="border rounded-lg p-3 flex justify-between gap-3">
                  <div>
                    <div className="font-medium">{addr.fullName}</div>
                    <div>{addr.addressLine1}</div>
                    {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                    <div>
                      {addr.city}, {addr.state} {addr.postalCode}
                    </div>
                    <div>{addr.country}</div>
                    {addr.phone && <div>📞 {addr.phone}</div>}
                    {addr.isDefault && <div className="text-xs text-green-600 mt-1">Default address</div>}
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
<button
  disabled={loading}
  className="px-2 py-1 border rounded disabled:opacity-50"
  onClick={() => handleSetDefault(idx)}
>
                      {addr.isDefault ? "Default" : "Set default"}
                    </button>
                    <button className="px-2 py-1 text-red-500" onClick={() => handleRemoveAddress(idx)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new address */}
            <p className="text-xs text-gray-500 mb-2">
  Addresses are saved automatically.
</p>

<AddAddressForm
  onAdd={async (addr) => {
    const previous = addresses;
    const updated = [...addresses, addr];

    setAddresses(updated);

    const ok = await saveProfile(updated);
    if (ok) {
      toast.success("Address saved");
    } else {
      setAddresses(previous);
    }
  }}
/>


            <button onClick={()=>saveProfile} disabled={loading} className={`btn-primary mt-4 ${loading ? "opacity-70 pointer-events-none" : ""}`}>
              {loading ? "Saving..." : "Save addresses"}
            </button>
          </div>
        )}

        {/* TAB 4 — ORDERS (wired to /orders/myorders) */}
        {tab === "orders" && (
          <div className="bg-white p-6 rounded-2xl card-cosset text-gray-700">
            <h3 className="font-medium mb-3">Orders</h3>

            {ordersLoading && <p className="text-sm text-gray-500">Loading your orders...</p>}

            {ordersError && <p className="text-sm text-red-600 mb-2">{ordersError}</p>}

            {!ordersLoading && !ordersError && orders.length === 0 && <p className="text-sm text-gray-500">No orders yet. Once you place a purchase, it will appear here.</p>}

            {!ordersLoading && orders.length > 0 && (
              <div className="space-y-4 text-sm">
                {orders.map((order) => (
                  <div key={order._id} className="border rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-semibold">Order #{order._id.slice(-6).toUpperCase()}</div>
                        <div className="text-xs text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{order.totalPrice?.toFixed?.(2) ?? order.totalPrice}</div>
                        <div className="text-xs text-gray-500 capitalize">Status: {order.status || "pending"}</div>
                        {order.isPaid && <div className="text-xs text-green-600">Paid {order.paidAt && "on " + new Date(order.paidAt).toLocaleDateString()}</div>}
                      </div>
                    </div>

                    {/* order items preview */}
                    <div className="mt-2 space-y-2">
{order.orderItems?.map((item, idx) => {
  const imgSrc = item.image
    ? normalizeMediaUrl(item.image, { typeHint: "image" })
    : "/placeholder.png";

  const canReview = order.status === "delivered";

  return (
    <div
      key={idx}
      className="flex items-center justify-between gap-3 border rounded-lg p-2"
    >
      <div className="flex items-center gap-2 text-xs">
        <img
          src={imgSrc}
          alt={item.title}
          className="w-10 h-10 rounded object-cover"
        />
        <div className="min-w-0">
          <div className="truncate font-medium">{item.title}</div>
          <div className="text-gray-500">
            Qty: {item.qty} · ₹{item.price}
          </div>
        </div>
      </div>

      {/* REVIEW CTA */}
      {canReview && (
<button
  className="text-xs px-3 py-1 border rounded hover:bg-gray-50"
  onClick={() => {
    setReviewTarget({
      orderId: order._id,
      productId: item.product,
      productTitle: item.title,
    });
    setReviewForm({ rating: 0, comment: "" });
    setReviewModalOpen(true);
  }}
>
  Rate product
</button>

      )}
    </div>
  );
})}

                      {order.orderItems && order.orderItems.length > 3 && <div className="text-xs text-gray-500">+ {order.orderItems.length - 3} more items</div>}
                    </div>

                    {/* shipping summary */}
                    <div className="mt-2 text-xs text-gray-500">Deliver to: {order.shippingAddress?.city && `${order.shippingAddress.city}, `}{order.shippingAddress?.country || ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm modal (single reusable modal for this page) */}
      <ConfirmModal
        open={confirmOpen}
        title={confirmInfo?.action === "removeAddress" ? "Remove address" : "Confirm"}
        message={
          confirmInfo?.action === "removeAddress"
            ? "Are you sure you want to remove this address? This cannot be undone."
            : "Are you sure?"
        }
        confirmLabel={confirmInfo?.action === "removeAddress" ? "Remove" : "Confirm"}
        cancelLabel="Cancel"
        loading={false}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />

      {/* REVIEW MODAL */}
{reviewModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl w-full max-w-md p-6">
      <h3 className="text-lg font-semibold mb-2">
        Rate {reviewTarget?.productTitle}
      </h3>

      {/* Rating */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`text-xl ${
              reviewForm.rating >= n ? "text-gold" : "text-gray-300"
            }`}
            onClick={() =>
              setReviewForm((f) => ({ ...f, rating: n }))
            }
          >
            ★
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        className="w-full border rounded p-2 text-sm mb-4"
        rows={4}
        placeholder="Write your review (optional)"
        value={reviewForm.comment}
        onChange={(e) =>
          setReviewForm((f) => ({ ...f, comment: e.target.value }))
        }
      />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 text-sm border rounded"
          onClick={() => setReviewModalOpen(false)}
        >
          Cancel
        </button>

<button
  className="px-4 py-2 text-sm rounded bg-flame text-white disabled:opacity-50"
  disabled={reviewForm.rating === 0}
  onClick={submitReview}
>
  Submit
</button>

      </div>
    </div>
  </div>
)}

    </div>
  );
}

/** ---- SMALL INTERNAL COMPONENT FOR ADDING ADDRESS ---- */

function AddAddressForm({ onAdd }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.addressLine1 || !form.city) {
      toast.error("Please fill required fields");
      return;
    }
    onAdd(form);
    setForm({
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
    });
  };

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input className="border px-2 py-1 rounded" placeholder="Full name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
        <input className="border px-2 py-1 rounded" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        <input className="border px-2 py-1 rounded sm:col-span-2" placeholder="Address line 1" value={form.addressLine1} onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))} />
        <input className="border px-2 py-1 rounded sm:col-span-2" placeholder="Address line 2" value={form.addressLine2} onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))} />
        <input className="border px-2 py-1 rounded" placeholder="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        <input className="border px-2 py-1 rounded" placeholder="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
        <input className="border px-2 py-1 rounded" placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} />
        <input className="border px-2 py-1 rounded" placeholder="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
      </div>
      <button type="submit" className="px-3 py-1 border rounded">
        Add address
      </button>
    </form>
  );
}
