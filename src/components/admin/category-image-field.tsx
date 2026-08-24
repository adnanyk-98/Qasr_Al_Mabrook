"use client";

import { useState } from "react";
import { Label } from "@/components/ui/form";

type Props = {
  currentImageUrl?: string | null;
};

export function CategoryImageField({ currentImageUrl }: Props) {
  const [selectedFileName, setSelectedFileName] = useState(currentImageUrl ? "Existing image" : "No file selected");
  const [dimensions, setDimensions] = useState("—");
  const [status, setStatus] = useState(currentImageUrl ? "Existing image retained" : "No file selected");
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (!file) {
      setSelectedFileName("No file selected");
      setDimensions("—");
      setStatus("No file selected");
      setPreviewUrl(currentImageUrl ?? "");
      return;
    }

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;
      setPreviewUrl(dataUrl);

      const img = new Image();
      img.onload = () => {
        const nextDimensions = `${img.width} × ${img.height}`;
        setDimensions(nextDimensions);
        const isValid = img.width === img.height;
        setStatus(isValid ? "✓ Valid square image" : "Category images must be square (1:1).");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentImageUrl ?? "");
  const [objectKey, setObjectKey] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async () => {
    if (!selectedFile) {
      setUploadError("No file selected");
      return;
    }
    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("imageFile", selectedFile, selectedFile.name);
      const slugInput = (document.querySelector('input[name="slug"]') as HTMLInputElement | null)?.value ?? "category";
      fd.append("slug", slugInput);

      const res = await fetch("/api/admin/categories/image-upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Upload failed with ${res.status}`);
      }

      const body = await res.json();
      setUploadedUrl(body.publicUrl ?? "");
      setObjectKey(body.objectKey ?? "");
      setPreviewUrl(body.publicUrl ?? previewUrl);
      setSelectedFileName(selectedFile.name);
      setStatus("✓ Uploaded image");
    } catch (err: any) {
      setUploadError(String(err?.message ?? err));
      setStatus("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label htmlFor="categoryImageFile">Category image</Label>
      <input id="categoryImageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="block w-full text-sm" onChange={handleChange} />

      <input type="hidden" name="imageUrl" value={uploadedUrl} />
      <input type="hidden" name="objectKey" value={objectKey} />
      <input type="hidden" name="width" value={dimensions.split('×')[0]?.trim() ?? ''} />
      <input type="hidden" name="height" value={dimensions.split('×')[1]?.trim() ?? ''} />

      <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] p-3">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">Selected file</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--text-muted)]">Filename</span>
            <span className="text-sm text-[var(--foreground)]">{selectedFileName}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--text-muted)]">Dimensions</span>
            <span className="text-sm text-[var(--foreground)]">{dimensions}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--text-muted)]">Status</span>
            <span className={status.startsWith("✓") ? "text-sm text-emerald-600" : status === "No file selected" ? "text-sm text-[var(--text-muted)]" : "text-sm text-red-600"}>{status}</span>
          </div>
        </div>
        {previewUrl ? <img src={previewUrl} alt={"Category preview"} className="mt-3 h-28 w-full rounded object-contain" /> : null}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={uploadImage} disabled={uploading} className="rounded bg-[var(--brand-primary)] px-3 py-1 text-white">
            {uploading ? "Uploading…" : "Upload image"}
          </button>
          {uploadError ? <span className="text-sm text-red-600">{uploadError}</span> : null}
        </div>
      </div>
    </div>
  );
}
