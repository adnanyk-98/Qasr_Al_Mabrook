"use client";

import { useState } from "react";

import { Label } from "@/components/ui/form";

type HeroImageFieldProps = {
  fieldName: "desktopImageUrl" | "mobileImageUrl";
  uploadRole: "desktop" | "mobile";
  label: string;
  currentImageUrl?: string;
  currentAlt?: string;
};

export function HeroImageField({ fieldName, uploadRole, label, currentImageUrl, currentAlt }: HeroImageFieldProps) {
  const [selectedFileName, setSelectedFileName] = useState(currentImageUrl ? decodeURIComponent(currentImageUrl.split("/").pop() ?? "Existing hero image") : "No file selected");
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
        const expected = uploadRole === "mobile" ? "1080 × 1200" : "1920 × 720";
        const isValid = `${img.width} × ${img.height}` === expected;
        setStatus(isValid ? "✓ Valid hero banner" : `${label} must be exactly ${expected}.`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentImageUrl ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadHero = async () => {
    if (!selectedFile) {
      setUploadError("No file selected");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("imageFile", selectedFile, selectedFile.name);
      fd.append("role", uploadRole);

      const res = await fetch("/api/admin/homepage/hero-upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Upload failed with ${res.status}`);
      }

      const body = await res.json();
      setUploadedUrl(body.publicUrl ?? "");
      setPreviewUrl(body.publicUrl ?? previewUrl);
      setSelectedFileName(selectedFile.name);
      setStatus(`✓ Uploaded ${label.toLowerCase()}`);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : String(err));
      setStatus("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label htmlFor={`${fieldName}-file`}>{label}</Label>
      <input
        id={`${fieldName}-file`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="block w-full text-sm"
        onChange={handleChange}
      />

      {/* Hidden field used by the main Save form - contains only the R2 URL when uploaded */}
      <input type="hidden" name={fieldName} value={uploadedUrl} />

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
        {previewUrl ? (
          <div className="mt-3 w-full overflow-hidden rounded" style={{ aspectRatio: uploadRole === "mobile" ? "1080 / 1200" : "1920 / 720" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={currentAlt ?? "Hero banner preview"} className="h-full w-full object-contain" onLoad={(event) => setDimensions(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}`)} />
          </div>
        ) : null}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={uploadHero} disabled={uploading} className="rounded bg-[var(--brand-primary)] px-3 py-1 text-white">
            {uploading ? "Uploading…" : "Upload Hero"}
          </button>
          {uploadError ? <span className="text-sm text-red-600">{uploadError}</span> : null}
        </div>
      </div>
    </div>
  );
}
