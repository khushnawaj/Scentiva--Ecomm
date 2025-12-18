import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { normalizeMediaUrl } from "../../utils/media";

export default function AdminProductList() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

useEffect(() => {
  async function fetchProducts() {
    try {
      const res = await api.get("/products");

      // Handle different API shapes safely
      const list =
        Array.isArray(res.data)
          ? res.data
          : res.data.products || res.data.data || [];

      setProducts(list);
    } catch (err) {
      console.error("Failed to fetch products", err);
      setProducts([]);
    }
  }

  fetchProducts();
}, []);


  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">All Products</h2>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="px-3 py-1.5 bg-wax text-white rounded text-sm"
        >
          + Add Product
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Image</th>
            <th className="p-2 text-left">Title</th>
            <th className="p-2 text-left">Price</th>
            <th className="p-2 text-left">Stock</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id} className="border-t">
              <td className="p-2">
                <img
                  src={normalizeMediaUrl(p.images?.[0]?.url)}
                  className="w-12 h-12 object-cover rounded"
                />
              </td>
              <td className="p-2">{p.title}</td>
              <td className="p-2">₹{p.price}</td>
              <td className="p-2">{p.stock}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() =>
                    navigate(`/admin/products/${p._id}/edit`)
                  }
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button className="text-red-600" disabled>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
