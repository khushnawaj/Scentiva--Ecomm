// client/src/admin/DashboardStats.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function DashboardStats() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) return <p>Loading dashboard...</p>;

  return (
    <div className="grid gap-6">
      {/* TOP STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Products" value={data.totals.products} />
        <Stat label="Orders" value={data.totals.orders} />
        <Stat label="Users" value={data.totals.users} />
        <Stat label="Revenue" value={`₹${data.totals.revenue}`} />
      </div>

      {/* ORDER STATUS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(data.ordersByStatus).map(([k, v]) => (
          <Stat key={k} label={k} value={v} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border rounded-lg p-4 bg-[#faf7f4]">
      <div className="text-xs text-gray-500 uppercase">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
