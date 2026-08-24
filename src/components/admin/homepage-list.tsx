"use client";

import React, { useState } from "react";
import AdminConfirmModal from "./admin-confirm-modal";
import { useRouter } from "next/navigation";

type Section = {
  id: string;
  sectionType: string;
  status: string;
  sortOrder: number;
  configurationJson?: Record<string, any>;
};

export default function HomepageList({ initialItems, total, page, pageSize, basePath, search }: { initialItems: Section[]; total: number; page: number; pageSize: number; basePath: string; search?: string | null }) {
  const [items, setItems] = useState<Section[]>(initialItems);
  const [confirm, setConfirm] = useState<{ id: string; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onDelete = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/homepage/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sectionId: id }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Delete failed ${res.status}`);
      const newItems = items.filter((i) => i.id !== id);
      setItems(newItems);
      const newTotal = total - 1;
      const totalPages = Math.max(1, Math.ceil(newTotal / pageSize));
      if (page > totalPages) {
        router.replace(`${basePath}?page=${totalPages}`);
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
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="rounded border p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium break-words">{s.sectionType}</div>
                <div className="text-xs text-[var(--text-muted)]">Sort: {s.sortOrder}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs"><span className="rounded-full px-2.5 py-1 text-xs font-medium bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">{s.status}</span></div>
                <a href={`${basePath}?edit=${s.id}`} className="text-[var(--brand-primary)]">Edit</a>
                <button className="text-red-600 cursor-pointer" onClick={() => setConfirm({ id: s.id, label: s.sectionType })}>Delete</button>
              </div>
            </div>
            <div className="mt-3">
              <form action="/api/admin/homepage/status" method="post" className="flex items-center gap-2">
                <input type="hidden" name="sectionId" value={s.id} />
                <select name="status" defaultValue={s.status} className="max-w-[180px] rounded border px-2 py-1">
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <button type="submit" className="rounded bg-gray-100 px-3 py-1">Update</button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <AdminConfirmModal open={!!confirm} title={confirm ? `Delete ${confirm.label}?` : undefined} message="This action cannot be undone." confirmLabel="Delete section" loading={loading} onCancel={() => setConfirm(null)} onConfirm={() => confirm && onDelete(confirm.id)} />
    </div>
  );
}
