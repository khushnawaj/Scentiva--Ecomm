import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function AdminCouponList() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get("/coupons");
      setCoupons(data);
    } catch {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading coupons…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-[#8B5E3C]">
          Coupons
        </h2>
        <button
          onClick={() => navigate("/admin/coupons/new")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-wax text-white text-sm hover:opacity-90"
        >
          <FiPlus /> Create Coupon
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-[#faf7f4] border-b">
            <tr className="text-left">
              <th className="p-3">Code</th>
              <th className="p-3 text-center">Discount</th>
              <th className="p-3 text-center">Min Order</th>
              <th className="p-3 text-center">Expiry</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3 text-center">{c.discountPercent}%</td>
                <td className="p-3 text-center">₹{c.minOrderValue}</td>
                <td className="p-3 text-center">
                  {c.expiresAt
                    ? new Date(c.expiresAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {c.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="p-3 flex justify-center gap-3">
                  <button
                    onClick={() =>
                      navigate(`/admin/coupons/${c._id}/edit`)
                    }
                    className="text-blue-600 hover:underline"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => deleteCoupon(c._id)}
                    className="text-red-600 hover:underline"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {coupons.map((c) => (
          <div
            key={c._id}
            className="border rounded-lg p-4 bg-white space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="font-mono font-semibold">{c.code}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  c.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {c.isActive ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>Discount: {c.discountPercent}%</p>
              <p>Min Order: ₹{c.minOrderValue}</p>
              <p>
                Expiry:{" "}
                {c.expiresAt
                  ? new Date(c.expiresAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate(`/admin/coupons/${c._id}/edit`)}
                className="flex-1 border rounded py-1 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => deleteCoupon(c._id)}
                className="flex-1 border rounded py-1 text-sm text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
