import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_SECURITY_POLICY } from "@/lib/security-policy";

function getDirective(name: string): string[] {
  const directive = CONTENT_SECURITY_POLICY.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name} `));
  assert.ok(directive, `Expected CSP directive ${name}`);
  return directive.split(/\s+/).slice(1);
}

test("the production CSP allows the Clarity loader without relaxing unrelated directives", () => {
  assert.deepEqual(getDirective("default-src"), [
    "'self'",
    "https://*.clarity.ms",
    "https://c.bing.com",
  ]);
  assert.deepEqual(getDirective("script-src"), [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://www.clarity.ms",
    "https://*.clarity.ms",
  ]);
  assert.deepEqual(getDirective("connect-src"), [
    "'self'",
    "https:",
    "https://*.clarity.ms",
    "https://c.bing.com",
  ]);
  assert.deepEqual(getDirective("img-src"), ["'self'", "data:", "blob:", "https:"]);
  assert.deepEqual(getDirective("frame-src"), ["https://www.google.com"]);
  assert.deepEqual(getDirective("object-src"), ["'none'"]);
  assert.deepEqual(getDirective("frame-ancestors"), ["'none'"]);
  assert.deepEqual(getDirective("base-uri"), ["'self'"]);
  assert.deepEqual(getDirective("form-action"), ["'self'"]);

  assert.equal(getDirective("script-src").includes("https://c.bing.com"), false);
  assert.equal(
    getDirective("frame-src").some((host) => host.includes("clarity")),
    false,
  );
});
