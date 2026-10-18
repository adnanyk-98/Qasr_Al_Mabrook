import { buildTelephoneHref } from "@/lib/phone-display";

const HOMEPAGE_CONTACT_SESSION_KEY = "qam-homepage-contact-popup-shown";

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function claimHomepageContactPopupSession(
  storage: SessionStorageLike | null,
): boolean {
  if (!storage) return true;

  try {
    if (storage.getItem(HOMEPAGE_CONTACT_SESSION_KEY) === "shown") return false;
    storage.setItem(HOMEPAGE_CONTACT_SESSION_KEY, "shown");
    return true;
  } catch {
    return true;
  }
}

export function buildWhatsAppUrl(number: string | null | undefined): string | null {
  if (!number) return null;

  const telephoneHref = buildTelephoneHref(number);
  const digits = telephoneHref
    ? telephoneHref.slice("tel:+".length)
    : number.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) {
    return null;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent("Hi!")}`;
}
