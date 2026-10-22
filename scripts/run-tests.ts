import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const testsDirectory = resolve("tests");
const require = createRequire(resolve("package.json"));
const testFiles = readdirSync(testsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
  .map((entry) => resolve(testsDirectory, entry.name))
  .sort();

if (testFiles.length === 0) {
  throw new Error(`No test files found in ${testsDirectory}`);
}

const result = spawnSync(
  process.execPath,
  [
    require.resolve("tsx/cli"),
    "--require",
    resolve(testsDirectory, "setup.ts"),
    "--test",
    ...testFiles,
  ],
  { stdio: "inherit" },
);

if (result.error) {
  console.error("Unable to start the test runner:", result.error);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
