"use client";

import React, { useState } from "react";
import AdminConfirmModal from "./admin-confirm-modal";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  slug: string;
  status: string;
  sortOrder: number;
};

export default function CategoryList({ initialItems, total, page, pageSize, basePath, search }: { initialItems: Category[]; total: number; page: number; pageSize: number; basePath: string; search?: string | null }) {
  const [items, setItems] = useState<Category[]>(initialItems);
  const [confirm, setConfirm] = useState<{ id: string; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categoryId: id }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Delete failed ${res.status}`);
      const newItems = items.filter((i) => i.id !== id);
      setItems(newItems);
      const newTotal = total - 1;
      const totalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > totalPages) {
        router.replace(`${basePath}?page=${totalPages}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
      } else {
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
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--text-muted)]"><th className="w-10">#</th><th>Name</th><th className="w-24">Status</th><th className="w-24">Sort</th><th className="w-36">Actions</th></tr>
          </thead>
          <tbody>
            {items.map((c, idx) => (
              <tr key={c.id} className="border-t">
                <td className="py-3">{(page - 1) * pageSize + idx + 1}</td>
                <td className="py-3">
                  <div className="font-medium break-words">{c.slug}</div>
                </td>
                <td className="py-3"><div className="text-xs"><span className="rounded-full px-2.5 py-1 text-xs font-medium bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">{c.status}</span></div></td>
                <td className="py-3">{c.sortOrder}</td>
                <td className="py-3"><div className="flex gap-3"><a href={`${basePath}?edit=${c.id}`} className="text-[var(--brand-primary)]">Edit</a><button className="text-red-600 cursor-pointer" onClick={() => setConfirm({ id: c.id, label: c.slug })}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

            <div className="md:hidden space-y-3">
        {items.map((c, idx) => (
          <div key={c.id} className="rounded border p-3 bg-white">
            <div className="flex items-center justify-between">
              <div>
                        <div className="font-medium break-words">{c.slug}</div>
                <div className="text-xs text-[var(--text-muted)]">Sort: {c.sortOrder}</div>
              </div>
              <div className="flex flex-col gap-2">
                <a href={`${basePath}?edit=${c.id}`} className="inline-flex items-center justify-center px-3 py-1 rounded border text-sm">Edit</a>
                <button className="inline-flex items-center justify-center px-3 py-1 rounded border text-sm text-red-600 cursor-pointer" onClick={() => setConfirm({ id: c.id, label: c.slug })}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminConfirmModal open={!!confirm} title={confirm ? `Delete ${confirm.label}?` : undefined} message="This action cannot be undone." confirmLabel="Delete category" loading={loading} onCancel={() => setConfirm(null)} onConfirm={() => confirm && onDelete(confirm.id)} />
    </div>
  );
}
