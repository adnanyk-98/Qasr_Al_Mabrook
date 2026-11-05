import assert from "node:assert/strict";
import { test } from "node:test";

import { siteConfig } from "../src/config/site";
import { buildTelephoneHref, formatPublicPhoneNumber } from "../src/lib/phone-display";

test("homepage and product map actions use the official Google Maps listing", () => {
  const expectedMapsUrl =
    "https://www.google.com/maps/place/Qasr+Al+Mabrook+Trading+LLC/@25.3595724,55.3887041,17z/data=!3m1!4b1!4m6!3m5!1s0x3e5f5a31d351dcf7:0x45b5fd047feac859!8m2!3d25.3595676!4d55.391279!16s%2Fg%2F11bbwps06h?entry=ttu&g_ep=EgoyMDI2MTEwMi4wIKXMDSoASAFQAw%3D%3D";

  assert.equal(siteConfig.contact.mapsUrl, expectedMapsUrl);
  assert.equal(buildTelephoneHref(siteConfig.contact.phone), "tel:+971503093800");
});

test("UAE international numbers are spaced for display without changing their telephone destination", () => {
  assert.equal(formatPublicPhoneNumber("+971503093800"), "+971 50 309 3800");
  assert.equal(formatPublicPhoneNumber("00971503093800"), "+971 50 309 3800");
  assert.equal(buildTelephoneHref("+971 50 309 3800"), "tel:+971503093800");
  assert.equal(buildTelephoneHref("00971 50 309 3800"), "tel:+971503093800");
});

test("valid international numbers accept common presentation separators", () => {
  assert.equal(formatPublicPhoneNumber("+1 (212) 555-0100"), "+1 (212) 555-0100");
  assert.equal(buildTelephoneHref("+1 (212) 555-0100"), "tel:+12125550100");
  assert.equal(buildTelephoneHref("+44 20-7946-0958"), "tel:+442079460958");
  assert.equal(buildTelephoneHref("0044 (20) 7946 0958"), "tel:+442079460958");
});

test("invalid phone values are not converted into telephone links", () => {
  const invalidNumbers = [
    "",
    "   ",
    "Call +971 50 309 3800",
    "+971 50 309 3800 ext. 12",
    "++971503093800",
    "+971++503093800",
    "+971 (50 309) 3800",
    "0503093800",
    "+01234567",
    `+${"1".repeat(16)}`,
  ];

  for (const phone of invalidNumbers) {
    assert.equal(buildTelephoneHref(phone), null, `expected ${JSON.stringify(phone)} to be rejected`);
    assert.equal(formatPublicPhoneNumber(phone), phone);
  }
});

test("other valid international phone formats remain unchanged for display", () => {
  assert.equal(formatPublicPhoneNumber("+1 (212) 555-0100"), "+1 (212) 555-0100");
  assert.equal(buildTelephoneHref("+1 (212) 555-0100"), "tel:+12125550100");
});
