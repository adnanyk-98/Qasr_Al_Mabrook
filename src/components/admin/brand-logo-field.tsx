"use client";

import { useState } from "react";
import { Label } from "@/components/ui/form";

export function BrandLogoField({ currentImageUrl }: { currentImageUrl?: string | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(currentImageUrl ?? "");
  const [dimensions, setDimensions] = useState("—");
  const [status, setStatus] = useState(currentImageUrl ? "Existing logo retained" : "No file selected");
  const [uploadedUrl, setUploadedUrl] = useState(currentImageUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setError(null);
    if (!selected) {
      setPreview(currentImageUrl ?? "");
      setDimensions("—");
      setStatus(currentImageUrl ? "Existing logo retained" : "No file selected");
      return;
    }
    setStatus("Selected, not uploaded");
    setDimensions("Reading…");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setPreview(dataUrl);
      const image = new Image();
      image.onload = () => {
        setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
        if (image.naturalWidth !== image.naturalHeight) {
          setError("Brand logo must be square (1:1).");
          setStatus("Invalid dimensions");
        } else {
          setStatus("Valid square logo");
        }
      };
      image.onerror = () => { setError("Unable to read the selected image."); setStatus("Invalid image"); };
      image.src = dataUrl;
    };
    reader.readAsDataURL(selected);
  };

  const upload = async () => {
    if (!file) { setError("Select a logo before uploading."); return; }
    const [width, height] = dimensions.split("×").map((value) => Number(value.trim()));
    if (error || !Number.isFinite(width) || !Number.isFinite(height) || width !== height) { setError("Brand logo must be square (1:1)."); return; }
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("imageFile", file, file.name);
      const brandId = (document.querySelector('input[name="brandId"]') as HTMLInputElement | null)?.value;
      if (brandId) data.append("brandId", brandId);
      const response = await fetch("/api/admin/brands/image-upload", { method: "POST", body: data });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.error ?? `Upload failed with ${response.status}`);
      setUploadedUrl(body.publicUrl);
      setStatus("Uploaded logo");
      setDimensions(`${body.width} × ${body.height}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
      setStatus("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label htmlFor="brandLogoFile">Logo</Label>
      <input id="brandLogoFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={handleChange} className="block w-full text-sm" />
      <input type="hidden" name="logoUrl" value={uploadedUrl} />
      <div className="mt-3 space-y-2 rounded-[var(--radius-md)] border border-[var(--brand-border)] bg-[var(--brand-surface-alt)] p-3 text-sm">
        <div className="flex justify-between gap-3"><span className="text-[var(--text-muted)]">Filename</span><span>{file?.name ?? (currentImageUrl ? "Existing logo" : "No file selected")}</span></div>
        <div className="flex justify-between gap-3"><span className="text-[var(--text-muted)]">Dimensions</span><span>{dimensions}</span></div>
        <div className="flex justify-between gap-3"><span className="text-[var(--text-muted)]">Status</span><span>{status}</span></div>
        {preview ? <img src={preview} alt="Brand logo preview" className="mx-auto mt-3 h-28 w-28 rounded object-contain" /> : null}
        <button type="button" onClick={(event) => { event.preventDefault(); void upload(); }} disabled={uploading || status === "Invalid dimensions"} className="rounded bg-[var(--brand-primary)] px-3 py-1.5 text-white disabled:opacity-50">{uploading ? "Uploading..." : "Upload logo"}</button>
        {error ? <p className="text-red-600" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}
