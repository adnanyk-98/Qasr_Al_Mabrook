export type ImageValidationInput = {
  mimeType?: string | null;
  size?: number | null;
  width?: number | null;
  height?: number | null;
};

export type ImageValidationResult =
  | { ok: true; width: number; height: number; mimeType: string }
  | { ok: false; error: string };

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const MAX_IMAGE_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export function validateSquareImageUpload(input: ImageValidationInput): ImageValidationResult {
  const mimeType = input.mimeType?.trim().toLowerCase();
  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: "Image must be a valid image file (JPEG, PNG, WebP, AVIF, or GIF)." };
  }

  const width = Number(input.width ?? 0);
  const height = Number(input.height ?? 0);
  const size = Number(input.size ?? 0);

  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return { ok: false, error: "Unable to read the uploaded image dimensions." };
  }

  if (size <= 0) {
    return { ok: false, error: "The uploaded file is empty or unreadable." };
  }

  if (size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return { ok: false, error: "Image file is too large. Please upload an image under 8MB." };
  }

  if (width !== height) {
    return { ok: false, error: "Product images must be square (1:1)." };
  }

  return { ok: true, width, height, mimeType };
}
