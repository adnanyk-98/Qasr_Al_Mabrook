import Image from "next/image";

type PublicImageVariant =
  | "product-card"
  | "product-detail-main"
  | "product-detail-thumbnail"
  | "homepage-hero"
  | "homepage-banner"
  | "category-card";

const variantClasses: Record<PublicImageVariant, string> = {
  "product-card": "relative mx-auto w-full max-w-[min(100%,220px)] aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-[var(--brand-surface-alt)]",
  "product-detail-main": "relative mx-auto w-full max-w-[min(100%,500px)] aspect-square overflow-hidden rounded-[var(--radius-xl)] bg-[var(--brand-surface-alt)]",
  "product-detail-thumbnail": "relative mx-auto w-full max-w-[88px] aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--brand-surface-alt)]",
  "homepage-hero": "relative aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--brand-surface-alt)] lg:aspect-[16/10]",
  "homepage-banner": "relative aspect-[3/1] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--brand-surface-alt)]",
  "category-card": "relative mx-auto w-full max-w-[min(100%,220px)] aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-[var(--brand-surface-alt)]",
};

export function PublicImageSlot({
  src,
  alt,
  variant,
  sizes,
  priority = false,
  fallbackLabel = "No image",
}: {
  src?: string | null;
  alt: string;
  variant: PublicImageVariant;
  sizes: string;
  priority?: boolean;
  fallbackLabel?: string;
}) {
  return (
    <div className={variantClasses[variant]}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized className="object-contain object-center" />
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--text-muted)]" role="img" aria-label={alt}>
          {fallbackLabel}
        </div>
      )}
    </div>
  );
}
