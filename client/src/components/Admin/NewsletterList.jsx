// client/src/pages/admin/NewsletterList.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { toast } from "react-hot-toast";
import ConfirmModal from "../../components/ConfirmModal";

export default function NewsletterList() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState(null); // { id, email }

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get("/newsletter");
      setSubs(data || []);
    } catch (err) {
      console.error("Failed to load subscribers", err);
      const msg = err?.response?.data?.message || "Failed to load subscribers";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const openConfirm = (id, email) => {
    setConfirmInfo({ id, email });
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmInfo(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmInfo?.id) {
      closeConfirm();
      return;
    }

    const id = confirmInfo.id;
    setDeletingId(id);

    try {
      const promise = api.delete(`/newsletter/${id}`);

      await toast.promise(promise, {
        loading: "Removing subscriber...",
        success: () => "Subscriber removed",
        error: (err) => err?.response?.data?.message || "Failed to remove subscriber",
      });

      // optimistic update after success
      setSubs((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Delete subscriber failed", err);
      // toast.promise already showed error
    } finally {
      setDeletingId(null);
      closeConfirm();
    }
  };

  const handleExportCSV = () => {
    if (!subs.length) {
      toast.error("No subscribers to export.");
      return;
    }

    const header = ["Email", "Subscribed At"];
    const rows = subs.map((s) => [
      s.email,
      s.createdAt ? new Date(s.createdAt).toISOString() : "",
    ]);

    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "newsletter-subscribers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV exported");
  };

  return (
    <div>
      <h2
        className="text-2xl font-semibold mb-2"
        style={{ fontFamily: "'Playfair Display', serif", color: "#6B492E" }}
      >
        Newsletter Subscribers
      </h2>

      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-gray-500">
          Total: <strong>{subs.length}</strong>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSubscribers}
            className="px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-gray-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded animate-pulse"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-red-500 bg-white p-3 rounded shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && subs.length === 0 && (
        <div className="bg-white p-4 rounded shadow-sm text-gray-600">
          No subscribers yet.
        </div>
      )}

      {!loading && !error && subs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-cream/60">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-textmuted">
                  #
                </th>
                <th className="px-4 py-2 text-left font-semibold text-textmuted">
                  Email
                </th>
                <th className="px-4 py-2 text-left font-semibold text-textmuted">
                  Subscribed At
                </th>
                <th className="px-4 py-2 text-left font-semibold text-textmuted text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s, idx) => (
                <tr
                  key={s._id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-2 align-middle text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2 align-middle font-medium text-textmuted">
                    {s.email}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-gray-500">
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 align-middle text-right">
                    <button
                      onClick={() => openConfirm(s._id, s.email)}
                      disabled={deletingId === s._id}
                      className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === s._id ? "Removing..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Remove subscriber"
        message={
          confirmInfo?.email
            ? `Remove ${confirmInfo.email} from subscribers? This cannot be undone.`
            : "Remove this subscriber? This cannot be undone."
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        loading={deletingId === confirmInfo?.id}
        onConfirm={handleDeleteConfirmed}
        onCancel={closeConfirm}
      />
    </div>
  );
}
