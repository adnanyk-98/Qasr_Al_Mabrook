"use client";

import Image from "next/image";
import { useState } from "react";

type DealProduct = {
  id: string;
  name: string;
  slug: string;
  primaryImageUrl: string | null;
};

export function DealProductSelector({ products, selectedId }: { products: DealProduct[]; selectedId?: string }) {
  const [productId, setProductId] = useState(selectedId ?? products[0]?.id ?? "");
  const selectedProduct = products.find((product) => product.id === productId);

  return (
    <div className="space-y-3">
      <label htmlFor="productId" className="mb-2 block text-sm font-medium text-[var(--foreground)]">Product</label>
      <select id="productId" name="productId" value={productId} onChange={(event) => setProductId(event.target.value)} required className="w-full rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)]">
        <option value="" disabled>Select an existing product</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.slug})</option>)}
      </select>
      {selectedProduct ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-[var(--brand-border)] bg-white">
            {selectedProduct.primaryImageUrl ? <Image src={selectedProduct.primaryImageUrl} alt={selectedProduct.name} fill sizes="64px" className="object-contain" unoptimized /> : null}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--foreground)]">{selectedProduct.name}</p>
            <p className="text-xs text-[var(--text-muted)]">/{selectedProduct.slug}</p>
            <a href={`/en/products/${selectedProduct.slug}`} target="_blank" rel="noreferrer" className="text-xs text-[var(--brand-primary)]">View product</a>
          </div>
        </div>
      ) : <p className="text-sm text-[var(--text-muted)]">No published products match this search.</p>}
    </div>
  );
}
