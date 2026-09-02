import assert from "node:assert/strict";
import test from "node:test";

import { evaluateMigrationTarget, isLocalDevelopmentHost } from "../scripts/migration-db";

test("allows explicit local migration targets for dev workflows", () => {
  assert.equal(
    evaluateMigrationTarget("DIRECT_DATABASE_URL", "postgresql://postgres:secret@localhost:5432/app", {
      deploymentStage: "local",
      migrationConfirmation: "",
      allowFallback: false,
    }).ok,
    true,
  );

  assert.equal(isLocalDevelopmentHost("localhost"), true);
  assert.equal(isLocalDevelopmentHost("db.example.com"), false);
});

test("rejects staging production targets without explicit approval", () => {
  const result = evaluateMigrationTarget(
    "DIRECT_DATABASE_URL",
    "postgresql://postgres:secret@db.example.com:5432/app",
    {
      deploymentStage: "staging",
      migrationConfirmation: "",
      allowFallback: false,
    },
  );

  assert.equal(result.ok, false);
  assert.match(result.reason ?? "", /explicit/);
});

test("refuses silent DATABASE_URL fallback unless explicitly enabled", () => {
  const result = evaluateMigrationTarget(
    "DATABASE_URL",
    "postgresql://postgres:secret@db.example.com:5432/app",
    {
      deploymentStage: "development",
      migrationConfirmation: "",
      allowFallback: false,
    },
  );

  assert.equal(result.ok, false);
  assert.match(result.reason ?? "", /disabled/i);
});
