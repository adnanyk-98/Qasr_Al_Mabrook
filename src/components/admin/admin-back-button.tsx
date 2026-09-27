"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type AdminBackButtonProps = {
  fallbackHref?: string;
  label?: string;
};

const FallbackRoutes: Record<string, string> = {
  "/admin/products": "/admin",
  "/admin/categories": "/admin",
  "/admin/brands": "/admin",
  "/admin/translations": "/admin",
  "/admin/attributes": "/admin",
  "/admin/homepage": "/admin",
  "/admin/deals": "/admin",
  "/admin/enquiries": "/admin",
  "/admin/images": "/admin",
  "/admin/specifications": "/admin",
  "/admin/users": "/admin",
};

export function AdminBackButton({ fallbackHref, label = "Back" }: AdminBackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window === "undefined") {
      router.push(fallbackHref ?? "/admin");
      return;
    }

    const currentUrl = new URL(window.location.href);
    const pathname = currentUrl.pathname;
    const previous = document.referrer;
    const previousUrl = previous ? new URL(previous) : null;

    if (
      previousUrl &&
      previousUrl.origin === window.location.origin &&
      (previousUrl.pathname === "/admin" || previousUrl.pathname.startsWith("/admin/")) &&
      previousUrl.pathname !== "/admin/login" &&
      (previousUrl.pathname !== pathname || previousUrl.search !== currentUrl.search)
    ) {
      router.back();
      return;
    }

    const productEditFallback = pathname === "/admin/products" && currentUrl.searchParams.has("edit")
      ? "/admin/products"
      : undefined;
    const nextFallback = fallbackHref ?? productEditFallback ?? FallbackRoutes[pathname] ?? "/admin";
    router.push(nextFallback);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="w-fit"
      aria-label={label}
    >
      ← {label}
    </Button>
  );
}