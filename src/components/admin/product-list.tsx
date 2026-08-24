"use client";

import React, { useState } from "react";
import AdminConfirmModal from "./admin-confirm-modal";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  slug: string;
  defaultSku?: string | null;
  status: string;
};

export default function ProductList({ initialItems, total, page, pageSize, basePath, search }: { initialItems: Product[]; total: number; page: number; pageSize: number; basePath: string; search?: string | null }) {
  const [items, setItems] = useState<Product[]>(initialItems);
  const [confirm, setConfirm] = useState<{ id: string; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: id }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Delete failed ${res.status}`);
      // remove locally
      const newItems = items.filter((i) => i.id !== id);
      setItems(newItems);
      // adjust total and possibly navigate if page becomes invalid
      const newTotal = total - 1;
      const totalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > totalPages) {
        router.replace(`${basePath}?page=${totalPages}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
      } else {
        // simple refresh to update counts or keep local
        router.refresh();
      }
    } catch (e: any) {
      alert(String(e?.message ?? e));
    } finally {
      setLoading(false);
      setConfirm(null);
    }
  };

  return (
    <div>
      <div className="hidden md:block">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="text-left text-[var(--text-muted)]">
              <th className="w-10">#</th>
              <th>Product / ID</th>
              <th className="w-36">Default SKU</th>
              <th className="w-28">Status</th>
              <th className="w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p, idx) => (
              <tr key={p.id} className="border-t">
                <td className="py-3">{(page - 1) * pageSize + idx + 1}</td>
                <td className="py-3">
                  <div className="font-medium break-words">{p.slug}</div>
                  <div className="text-xs text-[var(--text-muted)] break-words">{p.id}</div>
                </td>
                <td className="py-3">{p.defaultSku ?? 'No SKU'}</td>
                <td className="py-3"><span className="rounded-full px-2.5 py-1 text-xs font-medium bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">{p.status}</span></td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <a href={`${basePath}?edit=${p.id}`} className="text-[var(--brand-primary)]">Edit</a>
                    <button className="text-red-600 cursor-pointer" onClick={() => setConfirm({ id: p.id, label: p.slug })}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((p, idx) => (
          <div key={p.id} className="rounded border p-3 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium break-words">{p.slug}</div>
                <div className="text-xs text-[var(--text-muted)] break-words">SKU: {p.defaultSku ?? 'No SKU'}</div>
              </div>
              <div className="text-xs">
                <div className="mb-2"><span className="rounded-full px-2.5 py-1 text-xs font-medium bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">{p.status}</span></div>
                <div className="flex flex-col gap-2">
                  <a href={`${basePath}?edit=${p.id}`} className="inline-flex items-center justify-center px-3 py-1 rounded border text-sm">Edit</a>
                  <button className="inline-flex items-center justify-center px-3 py-1 rounded border text-sm text-red-600 cursor-pointer" onClick={() => setConfirm({ id: p.id, label: p.slug })}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminConfirmModal open={!!confirm} title={confirm ? `Delete ${confirm.label}?` : undefined} message="This action cannot be undone." confirmLabel="Delete product" loading={loading} onCancel={() => setConfirm(null)} onConfirm={() => confirm && onDelete(confirm.id)} />
    </div>
  );
}
