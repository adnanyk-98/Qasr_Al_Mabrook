"use client";

import Link from "next/link";
import React from "react";

type Props = {
  total: number;
  page: number;
  pageSize: number;
  basePath: string; // e.g. /admin/products
  search?: string | null;
};

function buildUrl(basePath: string, page: number, pageSize: number, search?: string | null) {
  const u = new URL(basePath, typeof window !== 'undefined' ? window.location.origin : "http://localhost");
  u.searchParams.set("page", String(page));
  if (search) u.searchParams.set("search", search);
  u.searchParams.set("pageSize", String(pageSize));
  return u.pathname + u.search;
}

export default function AdminPagination({ total, page, pageSize, basePath, search }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    const from = Math.max(2, page - 1);
    const to = Math.min(totalPages - 1, page + 1);
    for (let i = from; i <= to; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-[var(--text-muted)]">Showing {start} to {end} of {total}</div>
      <div className="inline-flex items-center gap-2">
        <Link href={buildUrl(basePath, Math.max(1, page - 1), pageSize, search)} className={`inline-flex items-center justify-center px-3 py-1 rounded border ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}>Prev</Link>
        {pages.map((p, idx) => p === "..." ? (
          <span key={`e${idx}`} className="px-2">…</span>
        ) : (
          <Link key={p} href={buildUrl(basePath, Number(p), pageSize, search)} className={`inline-flex items-center justify-center px-3 py-1 rounded border ${p === page ? 'bg-[var(--brand-primary)] text-white' : ''}`}>{p}</Link>
        ))}
        <Link href={buildUrl(basePath, Math.min(totalPages, page + 1), pageSize, search)} className={`inline-flex items-center justify-center px-3 py-1 rounded border ${page === totalPages ? 'opacity-50 pointer-events-none' : ''}`}>Next</Link>
      </div>
    </div>
  );
}
