"use client";

import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import { generateCroppedImageFile, isSquareImageDimensions, loadImageFromUrl } from "@/lib/image-crop";
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
  const [cropCandidate, setCropCandidate] = useState<{ file: File; previewUrl: string; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropCandidateRef = useRef<typeof cropCandidate>(null);
  const pendingFilesRef = useRef<File[]>([]);
  const isProcessingFilesRef = useRef(false);
  const objectUrlsRef = useRef(new Set<string>());
  const isMountedRef = useRef(false);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      pendingFilesRef.current = [];
      cropCandidateRef.current = null;
      for (const objectUrl of objectUrls) {
        URL.revokeObjectURL(objectUrl);
      }
      objectUrls.clear();
    };
  }, []);

  const revokeObjectUrl = (objectUrl: string) => {
    if (objectUrlsRef.current.delete(objectUrl)) {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const resetCropState = () => {
    cropCandidateRef.current = null;
    setCropCandidate(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const uploadImageFile = async (file: File) => {
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
      };
      if (isMountedRef.current) {
        setImages((prev) => [
          ...prev,
          { ...entry, isPrimary: prev.length === 0 && !prev.some((image) => image.isPrimary) },
        ]);
      }
    } catch (error: unknown) {
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (isMountedRef.current) setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const processPendingFiles = async () => {
    if (isProcessingFilesRef.current || cropCandidateRef.current) return;

    isProcessingFilesRef.current = true;
    try {
      while (pendingFilesRef.current.length > 0 && isMountedRef.current) {
        const file = pendingFilesRef.current.shift();
        if (!file) continue;

        let imageSource: string;
        try {
          imageSource = URL.createObjectURL(file);
        } catch (createError) {
          if (isMountedRef.current) {
            setError(createError instanceof Error ? createError.message : "Unable to prepare the selected image.");
          }
          continue;
        }
        objectUrlsRef.current.add(imageSource);

        try {
          const image = await loadImageFromUrl(imageSource);
          if (!isMountedRef.current) {
            revokeObjectUrl(imageSource);
            break;
          }

          if (isSquareImageDimensions(image.naturalWidth, image.naturalHeight)) {
            revokeObjectUrl(imageSource);
            await uploadImageFile(file);
            continue;
          }

          const candidate = {
            file,
            previewUrl: imageSource,
            width: image.naturalWidth,
            height: image.naturalHeight,
          };
          cropCandidateRef.current = candidate;
          setCropCandidate(candidate);
          break;
        } catch (loadError) {
          revokeObjectUrl(imageSource);
          if (isMountedRef.current) {
            setError(loadError instanceof Error ? loadError.message : "Unable to read the selected image.");
          }
        }
      }
    } finally {
      isProcessingFilesRef.current = false;
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    pendingFilesRef.current.push(...Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
    void processPendingFiles();
  };

  const onCropComplete = (_: unknown, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  };

  const confirmCrop = async () => {
    const candidate = cropCandidateRef.current;
    if (!candidate) return;
    if (!croppedAreaPixels) {
      setError("The crop is not ready yet. Please wait for the preview to finish loading.");
      return;
    }

    isProcessingFilesRef.current = true;
    setIsCropping(true);
    let croppedFile: File | null = null;
    try {
      croppedFile = await generateCroppedImageFile(candidate.file, croppedAreaPixels, candidate.previewUrl);
    } catch (cropError) {
      if (isMountedRef.current) {
        setError(cropError instanceof Error ? cropError.message : "Unable to crop the selected image.");
      }
    } finally {
      revokeObjectUrl(candidate.previewUrl);
      if (cropCandidateRef.current === candidate) resetCropState();
      if (isMountedRef.current) setIsCropping(false);
      isProcessingFilesRef.current = false;
    }

    if (croppedFile && isMountedRef.current) await uploadImageFile(croppedFile);
    void processPendingFiles();
  };

  const cancelCrop = () => {
    if (isCropping) return;
    if (cropCandidateRef.current?.previewUrl) revokeObjectUrl(cropCandidateRef.current.previewUrl);
    resetCropState();
    void processPendingFiles();
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
      <div className="space-y-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--brand-primary-dark)] focus-within:ring-2 focus-within:ring-[var(--brand-primary)] focus-within:ring-offset-2">
          <span>Choose images</span>
          <input
            ref={fileInputRef}
            id="productImageFiles"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Choose product images"
          />
        </label>

        <div className="rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">Selected images</p>
          {images.length === 0 ? (
            <p className="mt-2 text-[var(--text-muted)]">No images selected yet.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {images.map((img, idx) => (
                <li key={img.id ?? `${img.objectKey}-${idx}`} className="flex items-center gap-2 text-[var(--foreground)]">
                  <span aria-hidden="true" className="text-emerald-600">✓</span>
                  <span className="truncate">{img.objectKey.split("/").pop() || `image-${idx + 1}`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {cropCandidate ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-[var(--radius-lg)] border border-[var(--brand-border)] bg-white p-4 shadow-[var(--shadow-lg)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-primary)]">Crop image</p>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Adjust the square crop</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={cancelCrop} disabled={isCropping}>Cancel</Button>
            </div>

            <div className="relative h-[320px] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)]">
              <Cropper
                image={cropCandidate.previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="crop-zoom" className="mb-2 block text-sm font-medium text-[var(--foreground)]">Zoom</label>
              <input
                id="crop-zoom"
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[var(--brand-primary)]"
                aria-label="Crop image zoom"
              />
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={cancelCrop} disabled={isCropping}>Cancel</Button>
              <Button type="button" onClick={() => { void confirmCrop(); }} disabled={isCropping}>Crop</Button>
            </div>
          </div>
        </div>
      ) : null}

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
