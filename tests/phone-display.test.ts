import assert from "node:assert/strict";
import { test } from "node:test";

import { buildTelephoneHref, formatPublicPhoneNumber } from "../src/lib/phone-display";

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
    assert.equal(
      buildTelephoneHref(phone),
      null,
      `expected ${JSON.stringify(phone)} to be rejected`,
    );
    assert.equal(formatPublicPhoneNumber(phone), phone);
  }
});

test("other valid international phone formats remain unchanged for display", () => {
  assert.equal(formatPublicPhoneNumber("+1 (212) 555-0100"), "+1 (212) 555-0100");
  assert.equal(buildTelephoneHref("+1 (212) 555-0100"), "tel:+12125550100");
});
