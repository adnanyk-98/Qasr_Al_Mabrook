export type AnalyzeResult = {
  sourcePath: string;
  originalWidth: number;
  originalHeight: number;
  normalizedWidth: number;
  normalizedHeight: number;
  reason?: string;
};

export async function analyzeImage(filePath: string): Promise<AnalyzeResult> {
  const { readFile } = await import("node:fs/promises");
  const { default: sharp } = await import("sharp");
  const buffer = await readFile(filePath);
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  return {
    sourcePath: filePath,
    originalWidth,
    originalHeight,
    normalizedWidth: originalWidth,
    normalizedHeight: originalHeight,
    reason: "product-images-are-uploaded-unchanged",
  };
}
