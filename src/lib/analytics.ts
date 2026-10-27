import { hasAnalyticsConsent } from "@/lib/analytics-consent";

export const analyticsEventNames = [
  "product_view",
  "product_request_quote",
  "category_view",
  "featured_product_click",
  "hero_click",
  "phone_click",
  "whatsapp_click",
  "map_click",
  "store_locator_view",
  "language_switch",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];
export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | undefined
>;

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: AnalyticsEventName,
  params: AnalyticsEventParams = {},
) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
  window.clarity?.("event", name);
  window.dispatchEvent(
    new CustomEvent("qam:analytics", { detail: { name, params: cleanParams } }),
  );
}
