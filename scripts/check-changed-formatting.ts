import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import * as prettier from "prettier";

const zeroSha = /^0+$/;

function git(args: string[]) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function resolveCommit(revision: string | undefined) {
  if (!revision) {
    throw new Error("Both FORMAT_BASE_SHA and FORMAT_HEAD_SHA are required.");
  }
  if (zeroSha.test(revision)) {
    return git(["hash-object", "-t", "tree", "--stdin"]).trim();
  }
  return git(["rev-parse", "--verify", `${revision}^{commit}`]).trim();
}

export function parseChangedPaths(nameStatusOutput: string) {
  const fields = nameStatusOutput.split("\0");
  const paths: string[] = [];

  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (!status) continue;

    if (status.startsWith("R") || status.startsWith("C")) {
      index++;
      const destination = fields[index++];
      if (destination) paths.push(destination);
      continue;
    }

    const filePath = fields[index++];
    if (filePath && status !== "D") paths.push(filePath);
  }

  return [...new Set(paths)];
}

export async function checkChangedFormatting(
  baseRevision: string | undefined,
  headRevision: string | undefined,
) {
  const base = resolveCommit(baseRevision);
  const checkWorktree = headRevision === "WORKTREE";
  const head = checkWorktree
    ? git(["rev-parse", "--verify", "HEAD^{commit}"]).trim()
    : resolveCommit(headRevision);
  const root = git(["rev-parse", "--show-toplevel"]).trim();
  const committedChanges = git([
    "diff",
    "--name-status",
    "--find-renames",
    "-z",
    base,
    head,
    "--",
  ]);
  const stagedChanges = checkWorktree
    ? git(["diff", "--cached", "--name-status", "--find-renames", "-z", head, "--"])
    : "";
  const candidates = [
    ...new Set([
      ...parseChangedPaths(committedChanges),
      ...parseChangedPaths(stagedChanges),
    ]),
  ];
  const unformatted: string[] = [];
  const checked: string[] = [];
  const ignored: string[] = [];

  for (const filePath of candidates) {
    const absolutePath = path.resolve(root, filePath);
    const fileInfo = await prettier.getFileInfo(absolutePath, {
      ignorePath: path.join(root, ".prettierignore"),
    });
    if (fileInfo.ignored) {
      ignored.push(filePath);
      continue;
    }
    if (!fileInfo.inferredParser) continue;

    const source = checkWorktree
      ? await readFile(absolutePath, "utf8")
      : git(["show", `${head}:${filePath}`]);
    const config = await prettier.resolveConfig(absolutePath);
    const options = { ...config, filepath: absolutePath };
    checked.push(filePath);

    if (!(await prettier.check(source, options))) {
      unformatted.push(filePath);
    }
  }

  return { checked, ignored, unformatted };
}

async function main() {
  const base = process.argv[2] ?? process.env.FORMAT_BASE_SHA;
  const head = process.argv[3] ?? process.env.FORMAT_HEAD_SHA;
  const result = await checkChangedFormatting(base, head);

  if (result.unformatted.length) {
    console.error("Changed files need Prettier formatting:");
    for (const filePath of result.unformatted) console.error(`  ${filePath}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Prettier check passed for ${result.checked.length} changed file(s); skipped ${result.ignored.length} ignored file(s).`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
