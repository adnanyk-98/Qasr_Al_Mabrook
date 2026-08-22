import assert from "node:assert/strict";
import test from "node:test";

import { generateR2ObjectKey, generateR2PublicUrl } from "@/lib/catalogue-import";

test("generate R2 object key and public url", () => {
  const key = generateR2ObjectKey("Adivasi Oil", "Adivasi Oil-#01.jpg");
  assert.equal(key, "catalogue/adivasi-oil/Adivasi-Oil-01.jpg");
  const pub = generateR2PublicUrl("https://cdn.example.com/", key);
  assert.equal(pub, "https://cdn.example.com/catalogue/adivasi-oil/Adivasi-Oil-01.jpg");
});
