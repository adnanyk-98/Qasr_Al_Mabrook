import assert from "node:assert/strict";
import test from "node:test";

import { buildLoopedCategorySequence, readLocalizedConfigString, resolvePageDirection } from "@/lib/homepage-content";

const heroConfig = {
  title: { en: "Classic Collection", ar: "مجموعة كلاسيكية" },
  subtitle: { en: "Handpicked for gifting" },
  desktopImageUrl: { en: "https://cdn.example.com/en-banner.jpg" },
};

test("uses English values as a fallback when Arabic content is missing", () => {
  assert.equal(readLocalizedConfigString(heroConfig, "title", "ar"), "مجموعة كلاسيكية");
  assert.equal(readLocalizedConfigString(heroConfig, "subtitle", "ar"), "Handpicked for gifting");
  assert.equal(readLocalizedConfigString(heroConfig, "desktopImageUrl", "ar"), "https://cdn.example.com/en-banner.jpg");
});

test("resolves RTL and LTR direction from the active locale", () => {
  assert.equal(resolvePageDirection("ar"), "rtl");
  assert.equal(resolvePageDirection("en"), "ltr");
});

test("duplicates category sequences to keep the marquee seamless", () => {
  const looped = buildLoopedCategorySequence(["A", "B", "C"]);
  assert.deepEqual(looped, ["A", "B", "C", "A", "B", "C"]);
  assert.equal(looped.length, 6);
});
