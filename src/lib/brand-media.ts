import { validateSquareImageUpload, type ImageValidationResult } from "@/lib/image-media";

export function validateBrandLogoUpload(input: { mimeType?: string | null; size?: number | null; width?: number | null; height?: number | null }): ImageValidationResult {
  const result = validateSquareImageUpload(input);
  if (!result.ok) return { ...result, error: result.error.replace("Product images", "Brand logos") };
  if (result.width < 256) return { ok: false, error: "Brand logo must be at least 256 × 256 pixels." };
  return result;
}
