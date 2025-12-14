import React, { useEffect, useRef } from "react";

export default function ConfirmModal({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}) {
  const containerRef = useRef(null);
  const cancelRef = useRef(null);

  // trap focus on open & return focus when closed (lightweight)
  useEffect(() => {
    if (!open) return;

    // save previously focused element to restore later
    const prev = document.activeElement;
    // focus the cancel button first for safety
    cancelRef.current?.focus();

    // prevent body scroll while modal open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      try {
        prev?.focus?.();
      } catch {}
    };
  }, [open]);

  // close on Escape (unless loading)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) {
        onCancel && onCancel();
      }
      // Enter should confirm if focused inside modal and not loading
      if (e.key === "Enter" && !loading) {
        // ignore Enter if an input inside modal is focused (to avoid accidental submit)
        const active = document.activeElement;
        if (active && /input|textarea|select/i.test(active.tagName || "")) return;
        onConfirm && onConfirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${loading ? "cursor-default" : "cursor-pointer"}`}
        onClick={loading ? undefined : onCancel}
      />

      {/* Modal */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="relative z-10 w-full max-w-md transform rounded-xl bg-white p-6 shadow-xl focus:outline-none
                   transition-all duration-200 ease-out
                   animate-fade-in-up"
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold mb-2">
          {title}
        </h2>

        <p id="confirm-modal-desc" className="text-sm text-gray-600 mb-5 whitespace-pre-line">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 focus:ring-2 focus:ring-offset-1 focus:ring-flame/30"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-flame text-white text-sm hover:brightness-95 disabled:opacity-50 focus:ring-2 focus:ring-offset-1 focus:ring-flame/40"
          >
            {loading ? "Updating…" : confirmLabel}
          </button>
        </div>
      </div>

      {/* small inline styles for a tiny entrance animation (Tailwind-like utilities assumed) */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px) scale(0.995); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 160ms ease-out both;
        }
      `}</style>
    </div>
  );
}
