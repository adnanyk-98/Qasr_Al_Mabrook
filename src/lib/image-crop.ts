export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function isSquareImageDimensions(width: number, height: number) {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width === height;
}

export function createSquareCropArea(width: number, height: number): CropArea {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const cropSize = Math.min(width, height);
  const x = width === cropSize ? 0 : (width - cropSize) / 2;
  const y = height === cropSize ? 0 : (height - cropSize) / 2;

  return {
    x,
    y,
    width: cropSize,
    height: cropSize,
  };
}

function getMimeTypeExtension(mimeType: string) {
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/avif") return ".avif";
  if (mimeType === "image/gif") return ".gif";
  return ".jpg";
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the selected image."));
    image.src = url;
  });
}

export async function generateCroppedImageFile(
  file: File,
  cropPixels: CropArea,
  sourceUrl: string,
): Promise<File> {
  const image = await loadImageFromUrl(sourceUrl);
  const targetWidth = Math.max(1, Math.round(cropPixels.width));
  const targetHeight = Math.max(1, Math.round(cropPixels.height));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create a canvas for image cropping.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.drawImage(
    image,
    Math.max(0, cropPixels.x),
    Math.max(0, cropPixels.y),
    Math.max(1, cropPixels.width),
    Math.max(1, cropPixels.height),
    0,
    0,
    targetWidth,
    targetHeight,
  );

  const mimeType = file.type && /^image\//.test(file.type) ? file.type : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, 0.92);
  });

  if (!blob) {
    throw new Error("Could not generate a cropped square image.");
  }

  const extension = getMimeTypeExtension(mimeType);
  const baseName = file.name.replace(/\.[^.]+$/, "") || "product-image";
  return new File([blob], `${baseName}-cropped${extension}`, { type: mimeType });
}