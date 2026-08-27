import assert from "node:assert/strict";
import test from "node:test";

import { validateBaselineAdoptionState } from "../scripts/baseline-adoption-policy";

const validState = {
  deploymentStage: "staging",
  confirmation: "ADOPT_BASELINE_0003",
  baselineVerified: true,
  homepageDealsExists: false,
  migrationHistoryExists: false,
};

test("baseline adoption requires the explicit confirmation", () => {
  assert.equal(validateBaselineAdoptionState({ ...validState, confirmation: undefined }).ok, false);
  assert.equal(validateBaselineAdoptionState({ ...validState, confirmation: "APPLY_MIGRATIONS" }).ok, false);
});

test("baseline adoption requires a verified staging baseline", () => {
  assert.equal(validateBaselineAdoptionState({ ...validState, deploymentStage: "production" }).ok, false);
  assert.equal(validateBaselineAdoptionState({ ...validState, baselineVerified: false }).ok, false);
});

test("baseline adoption refuses existing Deals or migration history", () => {
  assert.equal(validateBaselineAdoptionState({ ...validState, homepageDealsExists: true }).ok, false);
  assert.equal(validateBaselineAdoptionState({ ...validState, migrationHistoryExists: true }).ok, false);
});

test("valid baseline preconditions proceed", () => {
  assert.deepEqual(validateBaselineAdoptionState(validState), { ok: true, errors: [] });
});