import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function changedFiles(base: string, head: string): string[] {
  const committed = git([
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
    `${base}...${head}`,
  ]);
  const workingTree = git(["diff", "--name-only", "--diff-filter=ACMR", base]);
  const untracked = git(["ls-files", "--others", "--exclude-standard"]);

  return [
    ...new Set(
      `${committed}\n${workingTree}\n${untracked}`.split(/\r?\n/u).filter(Boolean),
    ),
  ];
}

const base = process.env.FORMAT_BASE_SHA;
const head = process.env.FORMAT_HEAD_SHA ?? "HEAD";

if (!head) {
  console.error("FORMAT_HEAD_SHA must be provided.");
  process.exit(1);
}

let resolvedBase = base;
if (!resolvedBase || /^0+$/u.test(resolvedBase)) {
  try {
    resolvedBase = git(["rev-parse", "--verify", "HEAD^"]);
  } catch {
    const files = git(["show", "--pretty=format:", "--name-only", "HEAD"])
      .split(/\r?\n/u)
      .filter(Boolean);
    if (files.length === 0) {
      console.log("No changed files to format-check.");
      process.exit(0);
    }

    const result = spawnSync(
      process.execPath,
      [resolve("node_modules", "prettier", "bin", "prettier.cjs"), "--check", ...files],
      { stdio: "inherit" },
    );
    if (result.error) {
      console.error("Unable to run Prettier:", result.error.message);
      process.exit(1);
    }
    process.exit(result.status ?? 1);
  }
}

const files = changedFiles(resolvedBase, head);

if (files.length === 0) {
  console.log("No changed files to format-check.");
  process.exit(0);
}

const prettierCli = resolve("node_modules", "prettier", "bin", "prettier.cjs");
const result = spawnSync(process.execPath, [prettierCli, "--check", ...files], {
  stdio: "inherit",
});

if (result.error) {
  console.error("Unable to run Prettier:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
