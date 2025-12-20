import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";
import { toast } from "react-hot-toast";

export default function AdminCouponForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountPercent: 10,
    maxDiscount: 0,
    minOrderValue: 0,
    expiresAt: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isEdit) return;
    api.get("/coupons").then(({ data }) => {
      const c = data.find((x) => x._id === id);
      if (c) {
        setForm({
          ...c,
          expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
        });
      }
    });
  }, [id, isEdit]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/coupons/${id}`, form);
        toast.success("Coupon updated");
      } else {
        await api.post("/coupons", form);
        toast.success("Coupon created");
      }
      navigate("/admin/coupons");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <form
        onSubmit={submit}
        className="bg-white border rounded-lg p-4 sm:p-6 space-y-5"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-[#8B5E3C]">
          {isEdit ? "Edit Coupon" : "Create Coupon"}
        </h2>

        <div className="grid gap-4">
          <div>
            <label className="text-sm text-gray-600">Coupon Code</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm uppercase"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Description</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600">Discount %</label>
              <input
                type="number"
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                value={form.discountPercent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountPercent: +e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Max Discount</label>
              <input
                type="number"
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                value={form.maxDiscount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxDiscount: +e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Min Order</label>
              <input
                type="number"
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                value={form.minOrderValue}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minOrderValue: +e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Expiry Date</label>
            <input
              type="date"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={form.expiresAt}
              onChange={(e) =>
                setForm({ ...form, expiresAt: e.target.value })
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.checked })
              }
            />
            Active
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/admin/coupons")}
            className="flex-1 border rounded py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-wax text-white rounded py-2 text-sm"
          >
            Save Coupon
          </button>
        </div>
      </form>
    </div>
  );
}
