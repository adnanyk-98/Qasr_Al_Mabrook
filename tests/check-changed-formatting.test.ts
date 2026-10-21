import assert from "node:assert/strict";
import test from "node:test";

import { parseChangedPaths } from "../scripts/check-changed-formatting";

test("changed formatting paths include additions, modifications, and rename destinations", () => {
  const paths = parseChangedPaths(
    "A\0added.ts\0M\0modified.ts\0R100\0old-name.ts\0new-name.ts\0",
  );

  assert.deepEqual(paths, ["added.ts", "modified.ts", "new-name.ts"]);
});

test("changed formatting paths omit deleted files and retain copied destinations", () => {
  const paths = parseChangedPaths("D\0deleted.ts\0C100\0source.ts\0copied.ts\0");

  assert.deepEqual(paths, ["copied.ts"]);
});
