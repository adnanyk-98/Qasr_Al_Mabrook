import assert from "node:assert/strict";
import test from "node:test";

import sharp from "sharp";

import { readOriginalProductImageMetadata, validateLocalImportMode } from "@/lib/catalogue-import";
import { validateR2Configuration } from "@/lib/production-readiness";

test("local DATABASE_URL accepted", () => {
  const mode = validateLocalImportMode("local", true, "postgresql://user:pass@localhost:5432/db");
  assert.equal(mode.ok, true);
});

test("remote Supabase DATABASE_URL accepted for development", () => {
  const mode = validateLocalImportMode(
    "local",
    true,
    "postgresql://postgres.ocbxudldjtpxzdfzmkyp:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
  );
  assert.equal(mode.ok, true);
});

test("malformed DATABASE_URL rejected", () => {
  const mode = validateLocalImportMode("local", true, "not-a-url");
  assert.equal(mode.ok, false);
});

test("missing DATABASE_URL rejected", () => {
  const mode = validateLocalImportMode("local", true, undefined);
  assert.equal(mode.ok, false);
});

test("R2 missing configuration detected", () => {
  const res = validateR2Configuration({});
  assert.equal(res.ok, false);
  const keys = res.errors.map((e) => e.key).sort();
  assert.ok(keys.includes("R2_ACCOUNT_ID"));
  assert.ok(keys.includes("R2_ACCESS_KEY_ID"));
  assert.ok(keys.includes("R2_SECRET_ACCESS_KEY"));
  assert.ok(keys.includes("R2_BUCKET_NAME"));
  assert.ok(keys.includes("R2_PUBLIC_BASE_URL"));
});

test("malformed R2 public URL detected", () => {
  const res = validateR2Configuration({
    r2AccountId: "a",
    r2AccessKeyId: "b",
    r2SecretAccessKey: "c",
    r2BucketName: "d",
    r2PublicBaseUrl: "not-a-url",
  });
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => e.key === "R2_PUBLIC_BASE_URL"));
});

test("valid R2 configuration accepted", () => {
  const res = validateR2Configuration({
    r2AccountId: "account",
    r2AccessKeyId: "access",
    r2SecretAccessKey: "secret",
    r2BucketName: "bucket",
    r2PublicBaseUrl: "https://cdn.example.com",
  });
  assert.equal(res.ok, true);
});

test("reads original product image dimensions without trimming", async () => {
  const buffer = await sharp({
    create: {
      width: 3,
      height: 2,
      channels: 3,
      background: "#ff0000",
    },
  })
    .png()
    .toBuffer();

  const metadata = await readOriginalProductImageMetadata(buffer);
  assert.deepEqual(metadata, { width: 3, height: 2 });
});
