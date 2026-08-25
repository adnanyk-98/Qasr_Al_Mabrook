export type HeroImageValidationInput = {
  role?: "desktop" | "mobile";
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
};

export type HeroImageValidationResult =
  | { ok: true; width: number; height: number; mimeType: string }
  | { ok: false; error: string };

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_HERO_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export function validateHeroImageUpload(input: HeroImageValidationInput): HeroImageValidationResult {
  const mimeType = input.mimeType?.trim().toLowerCase();
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: "Hero banner must be a valid image file (JPEG, PNG, WebP, AVIF, or GIF)." };
  }

  const width = Number(input.width ?? 0);
  const height = Number(input.height ?? 0);
  const size = Number(input.size ?? 0);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return { ok: false, error: "Unable to read the uploaded hero banner dimensions." };
  }

  if (size <= 0) {
    return { ok: false, error: "The uploaded file is empty or unreadable." };
  }

  if (size > MAX_HERO_FILE_SIZE_BYTES) {
    return { ok: false, error: "Hero banner file is too large. Please upload an image under 8MB." };
  }

  const expected = input.role === "mobile" ? { width: 1080, height: 1200 } : { width: 1920, height: 720 };
  if (width !== expected.width || height !== expected.height) {
    return { ok: false, error: `${input.role === "mobile" ? "Mobile" : "Desktop"} hero banner must be exactly ${expected.width} × ${expected.height}.` };
  }

  return { ok: true, width, height, mimeType };
}
