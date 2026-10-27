const mediaImageOrigin = "https://media.qasralmabrook.com";

export function isNextImageOptimizableSource(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/") && !src.startsWith("//")) return true;

  try {
    const url = new URL(src);
    return url.origin === mediaImageOrigin && !url.search;
  } catch {
    return false;
  }
}
