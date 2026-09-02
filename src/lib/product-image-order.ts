export type ProductImageOrderItem = {
  id?: string;
  objectKey: string;
  sortOrder?: number | null;
  isPrimary?: boolean;
};

export function reorderProductImages<T extends ProductImageOrderItem>(
  images: T[],
  index: number,
  direction: "up" | "down",
): T[] {
  if (images.length < 2) {
    return images.map((image, idx) => ({ ...image, sortOrder: idx }));
  }

  const currentIndex = Number.isInteger(index) ? index : 0;
  if (currentIndex < 0 || currentIndex >= images.length) {
    return images.map((image, idx) => ({ ...image, sortOrder: idx }));
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= images.length) {
    return images.map((image, idx) => ({ ...image, sortOrder: idx }));
  }

  const reordered = [...images];
  const [item] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, item);

  return reordered.map((image, idx) => ({
    ...image,
    sortOrder: idx,
  }));
}
