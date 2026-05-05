"use client";

import { useEffect } from "react";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "danger" | "primary" | "success";
  showCancel?: boolean;
  autoCloseMs?: number;
  onConfirm: () => void;
  onCancel: () => void;
  onAutoClose?: () => void;
};

export default function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  variant = "primary",
  showCancel = true,
  autoCloseMs,
  onConfirm,
  onCancel,
  onAutoClose,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel, open]);

  useEffect(() => {
    if (!open || !autoCloseMs || loading) return;

    const timeoutId = window.setTimeout(() => {
      if (onAutoClose) {
        onAutoClose();
        return;
      }
      onCancel();
    }, autoCloseMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoCloseMs, loading, onAutoClose, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirmation-modal-title" className="text-lg font-bold text-neutral-950">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{message}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={[
              "rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60",
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : variant === "success"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-[var(--brand)] hover:bg-[var(--brand-strong)]",
            ].join(" ")}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
