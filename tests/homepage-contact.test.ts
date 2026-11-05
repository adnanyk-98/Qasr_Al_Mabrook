import assert from "node:assert/strict";
import test from "node:test";

import { siteConfig } from "@/config/site";
import {
  buildWhatsAppUrl,
  claimHomepageContactPopupSession,
  type SessionStorageLike,
} from "@/lib/homepage-contact";
import { buildTelephoneHref } from "@/lib/phone-display";
import arMessages from "@/i18n/messages/ar.json";
import enMessages from "@/i18n/messages/en.json";

test("contact popup uses the configured mobile number for calls and WhatsApp", () => {
  const phoneHref = buildTelephoneHref(siteConfig.contact.phone);
  const whatsappUrl = buildWhatsAppUrl(siteConfig.contact.phone);

  assert.equal(phoneHref, "tel:+971503093800");
  assert.equal(whatsappUrl, "https://wa.me/971503093800?text=Hi!");
  const whatsapp = new URL(whatsappUrl ?? "");
  assert.equal(whatsapp.hostname, "wa.me");
  assert.equal(whatsapp.pathname, `/${phoneHref?.slice("tel:+".length)}`);
  assert.equal(whatsapp.searchParams.get("text"), "Hi!");
  assert.equal(
    siteConfig.contact.mapsUrl,
    "https://www.google.com/maps/place/Qasr+Al+Mabrook+Trading+LLC/@25.3595724,55.3887041,17z/data=!3m1!4b1!4m6!3m5!1s0x3e5f5a31d351dcf7:0x45b5fd047feac859!8m2!3d25.3595676!4d55.391279!16s%2Fg%2F11bbwps06h?entry=ttu&g_ep=EgoyMDI2MTEwMi4wIKXMDSoASAFQAw%3D%3D",
  );
});

test("WhatsApp URL normalizes an international number and pre-fills exactly Hi!", () => {
  const url = buildWhatsAppUrl("+971 50 309 3800");
  assert.equal(url, "https://wa.me/971503093800?text=Hi!");
  assert.equal(new URL(url!).searchParams.get("text"), "Hi!");
});

test("WhatsApp remains unavailable for an invalid number", () => {
  assert.equal(buildWhatsAppUrl("050 309 3800"), null);
});

test("contact popup stays dismissed after the current session has claimed it", () => {
  const values = new Map<string, string>();
  const storage: SessionStorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };

  assert.equal(claimHomepageContactPopupSession(storage), true);
  assert.equal(claimHomepageContactPopupSession(storage), false);
});

test("contact popup opens if session storage is unavailable", () => {
  const storage: SessionStorageLike = {
    getItem() {
      throw new Error("Storage unavailable");
    },
    setItem() {
      throw new Error("Storage unavailable");
    },
  };

  assert.equal(claimHomepageContactPopupSession(storage), true);
  assert.equal(claimHomepageContactPopupSession(null), true);
});

test("contact popup translations are complete in English and Arabic", () => {
  const keys = [
    "eyebrow",
    "title",
    "description",
    "callUs",
    "chatOnWhatsApp",
    "findOurShop",
    "close",
    "whatsAppUnavailable",
  ] as const;

  for (const key of keys) {
    assert.ok(enMessages.home.contactPopup[key]);
    assert.ok(arMessages.home.contactPopup[key]);
  }
});
