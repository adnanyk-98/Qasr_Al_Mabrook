import assert from "node:assert/strict";
import { test } from "node:test";

import { HTML_LIMITED_BOTS } from "@/lib/html-limited-bots";

test("HTML-limited crawler matching includes Screaming Frog and retains Next.js defaults", () => {
  assert.ok(HTML_LIMITED_BOTS.test("Screaming Frog SEO Spider/22.0"));
  assert.ok(HTML_LIMITED_BOTS.test("Bingbot/2.0"));
  assert.ok(HTML_LIMITED_BOTS.test("Slackbot-LinkExpanding 1.0"));
  assert.ok(HTML_LIMITED_BOTS.test("facebookexternalhit/1.1"));
  assert.ok(!HTML_LIMITED_BOTS.test("Mozilla/5.0 Chrome/131.0"));
});
