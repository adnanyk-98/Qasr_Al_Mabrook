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

test("contact popup uses verified telephone and Google Maps configuration", () => {
  assert.equal(buildTelephoneHref(siteConfig.contact.phone), "tel:+971503093800");
  assert.equal(siteConfig.contact.mapsUrl, "https://maps.app.goo.gl/AGAHaCeodMY7gPAY9");
});

test("WhatsApp URL uses the configured international number and exactly Hi!", () => {
  const url = buildWhatsAppUrl("+971 50 309 3800");
  assert.equal(url, "https://wa.me/971503093800?text=Hi!");
  assert.equal(new URL(url!).searchParams.get("text"), "Hi!");
});

test("WhatsApp is unavailable rather than guessed when no configured number exists", () => {
  assert.equal(buildWhatsAppUrl(""), null);
  assert.equal(buildWhatsAppUrl(undefined), null);
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
