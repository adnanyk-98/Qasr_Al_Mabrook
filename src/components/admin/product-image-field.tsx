"use client";

import { useState } from "react";
import { Label } from "@/components/ui/form";
import { reorderProductImages } from "@/lib/product-image-order";

type ImageEntry = {
  id?: string;
  publicUrl: string;
  objectKey: string;
  width?: number | null;
  height?: number | null;
  isPrimary?: boolean;
};

type Props = {
  currentImages?: ImageEntry[];
};

export function ProductImageField({ currentImages = [] }: Props) {
  const [images, setImages] = useState<ImageEntry[]>(() =>
    currentImages.map((i) => ({ ...i })),
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; idx: number; objectKey: string } | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(async (file) => {
      // client-side dimension check
      const dataUrl = await new Promise<string | null>((res) => {
        const r = new FileReader();
        r.onload = () => res(typeof r.result === "string" ? r.result : null);
        r.onerror = () => res(null);
        r.readAsDataURL(file);
      });
      if (!dataUrl) {
        setError("Failed to read file");
        return;
      }
      const img = new Image();
      img.onload = async () => {
        if (img.width !== img.height) {
          setError(`Image ${file.name} must be square (1:1).`);
          return;
        }

        // upload to multipart endpoint
        setUploading(true);
        setError(null);
        try {
          const fd = new FormData();
          fd.append("imageFile", file, file.name);
          const slugInput = (document.querySelector('input[name="slug"]') as HTMLInputElement | null)?.value ?? "product";
          fd.append("slug", slugInput);
          const res = await fetch("/api/admin/products/image-upload", { method: "POST", body: fd });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error || `Upload failed with ${res.status}`);
          }
          const body = await res.json();
          const entry: ImageEntry = {
            publicUrl: body.publicUrl,
            objectKey: body.objectKey,
            width: body.width ?? null,
            height: body.height ?? null,
            isPrimary: images.length === 0 && !images.some((i) => i.isPrimary),
          };
          setImages((prev) => [...prev, entry]);
        } catch (error: unknown) {
          setError(error instanceof Error ? error.message : String(error));
        } finally {
          setUploading(false);
        }
      };
      img.src = dataUrl;
    });
  };

  const removeImageAt = (idx: number) => {
    const img = images[idx];
    if (!img) return;
    // Unsaved image: just remove locally
    if (!img.id) {
      setImages((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    // Show confirmation modal for existing images
    setConfirmTarget({ id: img.id, idx, objectKey: img.objectKey });
  };

  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const setPrimaryAt = (idx: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));
  };

  const reorderAt = (idx: number, direction: "up" | "down") => {
    setImages((prev) => reorderProductImages(prev, idx, direction));
  };

  return (
    <div>
      {/* Toast notification */}
      {toast ? (
        <div className={`mb-2 p-2 rounded text-sm ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{toast.message}</div>
      ) : null}
      <Label htmlFor="productImageFiles">Product images</Label>
      <input id="productImageFiles" type="file" accept="image/*" multiple className="block w-full text-sm" onChange={(e) => handleFiles(e.target.files)} />

      <div className="mt-3 space-y-2">
        {images.map((img, idx) => (
          <div key={img.id ?? `${img.objectKey}-${idx}`} data-testid="product-image-item" className="flex items-center gap-3">
            {/* Dynamic uploaded URLs are intentionally rendered without Next image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.publicUrl} alt={`Image ${idx + 1}`} className="h-16 w-16 rounded object-contain" />
            <div className="flex-1 text-sm">
              <div>{img.objectKey}</div>
              <div className="text-xs text-[var(--text-muted)]">{img.width} × {img.height}</div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="text-xs text-[var(--brand-primary)] disabled:opacity-40" onClick={() => reorderAt(idx, "up")} disabled={idx === 0} aria-label="Move image up">
                ↑
              </button>
              <button type="button" className="text-xs text-[var(--brand-primary)] disabled:opacity-40" onClick={() => reorderAt(idx, "down")} disabled={idx === images.length - 1} aria-label="Move image down">
                ↓
              </button>
              <label className="text-sm">
                <input type="radio" name="primaryObjectKey" value={img.objectKey} checked={!!img.isPrimary} onChange={() => setPrimaryAt(idx)} /> Primary
              </label>
              <button data-testid="product-image-remove" type="button" className="text-sm text-red-600" onClick={() => removeImageAt(idx)} disabled={!!img.id && deletingIds.includes(img.id as string)}>
                {img.id && deletingIds.includes(img.id as string) ? 'Removing…' : 'Remove'}
              </button>
            </div>
            {/* Hidden inputs for each image to be included in the main form submit */}
            <input data-testid="product-image-url" type="hidden" name="imageUrl" value={img.publicUrl} />
            <input data-testid="product-image-objectKey" type="hidden" name="objectKey" value={img.objectKey} />
            <input data-testid="product-image-width" type="hidden" name="width" value={String(img.width ?? '')} />
            <input data-testid="product-image-height" type="hidden" name="height" value={String(img.height ?? '')} />
            <input data-testid="product-image-sort" type="hidden" name="sortOrder" value={String(idx)} />
            {img.id ? <input data-testid="product-image-id" type="hidden" name="imageId" value={img.id} /> : null}
          </div>
        ))}
      </div>

      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
      {uploading ? <div className="mt-2 text-sm">Uploading…</div> : null}

      {/* Confirmation modal */}
      {confirmTarget ? (
        <div data-testid="remove-image-modal" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Remove image?</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Are you sure you want to permanently remove this product image? This will delete the stored image.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button data-testid="cancel-remove-image" className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 h-9 text-sm" onClick={() => setConfirmTarget(null)} disabled={deletingIds.includes(confirmTarget.id)}>Cancel</button>
              <button data-testid="confirm-remove-image"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 h-9 text-sm bg-red-600 text-white"
                onClick={async () => {
                  if (!confirmTarget) return;
                  const id = confirmTarget.id;
                  setDeletingIds((prev) => [...prev, id]);
                  try {
                    const res = await fetch('/api/admin/products/image-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageId: id }) });
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      throw new Error(body?.error || `Delete failed ${res.status}`);
                    }
                    const body = await res.json();
                    // remove from state
                    setImages((prev) => prev.filter((_, i) => i !== confirmTarget.idx));
                    // update primary flags if server returned one
                    if (body?.newPrimaryImageId) {
                      setImages((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === body.newPrimaryImageId })));
                    }
                    setToast({ type: 'success', message: 'Image removed successfully.' });
                    setTimeout(() => setToast(null), 3500);
                    setConfirmTarget(null);
                  } catch (error: unknown) {
                    setToast({ type: 'error', message: error instanceof Error ? error.message : String(error) });
                    setTimeout(() => setToast(null), 5000);
                  } finally {
                    setDeletingIds((prev) => prev.filter((x) => x !== confirmTarget.id));
                  }
                }}
                disabled={deletingIds.includes(confirmTarget.id)}
              >
                {deletingIds.includes(confirmTarget.id) ? 'Removing…' : 'Remove image'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
