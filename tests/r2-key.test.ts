import assert from "node:assert/strict";
import test from "node:test";

import { generateR2ObjectKey, generateR2PublicUrl, PUBLIC_MEDIA_CACHE_CONTROL, versionR2Filename } from "@/lib/catalogue-import";

test("generate R2 object key and public url", () => {
  const key = generateR2ObjectKey("Adivasi Oil", "Adivasi Oil-#01.jpg", "version-1");
  assert.equal(key, "catalogue/adivasi-oil/Adivasi-Oil-01-version-1.jpg");
  const pub = generateR2PublicUrl("https://cdn.example.com/", key);
  assert.equal(pub, "https://cdn.example.com/catalogue/adivasi-oil/Adivasi-Oil-01-version-1.jpg");
});

test("versioned R2 filenames preserve the extension and produce unique replacement URLs", () => {
  const firstKey = generateR2ObjectKey("Adivasi Oil", "Adivasi Oil-#01.jpg", "version-1");
  const replacementKey = generateR2ObjectKey("Adivasi Oil", "Adivasi Oil-#01.jpg", "version-2");
  assert.notEqual(firstKey, replacementKey);
  assert.match(replacementKey, /-version-2\.jpg$/u);
  assert.equal(versionR2Filename("logo.png", "version-3"), "logo-version-3.png");
  assert.equal(PUBLIC_MEDIA_CACHE_CONTROL, "public, max-age=31536000, immutable");
});
