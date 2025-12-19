import React, { useEffect, useState } from "react";
import api from "../../api/api";
import {
  FiBox,
  FiShoppingBag,
  FiUsers,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ---------------- COLORS ---------------- */
const COLORS = ["#8B5E3C", "#F59E0B", "#3B82F6", "#10B981", "#EF4444"];

export default function DashboardStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <EmptyState />;

  const orderStatusData = Object.entries(data.ordersByStatus || {}).map(
    ([name, value]) => ({ name, value })
  );

  const avgOrderValue =
    data.totals.orders > 0
      ? Math.round(data.totals.revenue / data.totals.orders)
      : 0;

  const lowStock = data.lowStockProducts || [];
  const outOfStock = lowStock.filter((p) => p.stock === 0);

  return (
    <div className="space-y-6">
      {/* ================= KPIs ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KPI icon={<FiBox />} label="Products" value={data.totals.products} />
        <KPI icon={<FiShoppingBag />} label="Orders" value={data.totals.orders} />
        <KPI icon={<FiUsers />} label="Users" value={data.totals.users} />
        <KPI
          icon={<FiDollarSign />}
          label="Revenue"
          value={`₹${data.totals.revenue}`}
        />
      </div>

      {/* ================= HEALTH SIGNALS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Signal
          label="Avg Order Value"
          value={`₹${avgOrderValue}`}
          status="good"
        />
        <Signal
          label="Low Stock Items"
          value={lowStock.length}
          status={lowStock.length ? "warn" : "good"}
        />
        <Signal
          label="Out of Stock"
          value={outOfStock.length}
          status={outOfStock.length ? "danger" : "good"}
        />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card title="Orders by Status">
          <div className="w-full h-[240px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="#8B5E3C"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Orders Distribution">
          <div className="w-full h-[240px] sm:h-[260px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  dataKey="value"
                  outerRadius={80}
                  innerRadius={40}
                  labelLine={false}
                >
                  {orderStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ================= INVENTORY ALERTS ================= */}
      <Card title="Inventory Alerts">
        {lowStock.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((p) => (
              <div
                key={p._id}
                className={`border rounded-lg p-3 ${
                  p.stock === 0 ? "bg-red-50" : "bg-amber-50"
                }`}
              >
                <p className="font-medium text-sm truncate">{p.title}</p>
                <p
                  className={`text-xs mt-1 flex items-center gap-1 ${
                    p.stock === 0 ? "text-red-600" : "text-amber-700"
                  }`}
                >
                  <FiAlertTriangle />
                  Stock left: {p.stock}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            Inventory looks healthy
          </p>
        )}
      </Card>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function KPI({ icon, label, value }) {
  return (
    <div className="bg-white border rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#faf7f4] flex items-center justify-center text-[#8B5E3C]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase truncate">{label}</p>
        <p className="text-lg sm:text-xl font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

function Signal({ label, value, status }) {
  const colors = {
    good: "text-green-600",
    warn: "text-amber-600",
    danger: "text-red-600",
  };

  return (
    <div className="bg-white border rounded-xl p-4">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className={`text-lg sm:text-xl font-semibold ${colors[status]}`}>
        {value}
      </p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 truncate">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-60 bg-gray-100 rounded-xl" />
      <div className="h-60 bg-gray-100 rounded-xl" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center text-gray-500 py-12">
      Dashboard data unavailable
    </div>
  );
}
