"use client";

import React from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function AdminConfirmModal({ open, title = "Confirm", message = "Are you sure?", confirmLabel = "Delete", cancelLabel = "Cancel", loading = false, onCancel, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-md rounded bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{message}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button className="inline-flex items-center justify-center gap-2 rounded px-4 h-9 text-sm" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button className="inline-flex items-center justify-center gap-2 rounded px-4 h-9 text-sm bg-red-600 text-white" onClick={onConfirm} disabled={loading}>{loading ? "Deleting…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
