import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const migrationsDirectory = path.resolve("src/db/migrations");

test("every committed SQL migration is registered once in journal order", async () => {
  const journal = JSON.parse(
    await readFile(path.join(migrationsDirectory, "meta", "_journal.json"), "utf8"),
  ) as {
    entries: Array<{ idx: number; tag: string }>;
  };
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .map((filename) => filename.slice(0, -".sql".length))
    .sort();
  const journalTags = journal.entries.map(({ tag }) => tag);

  assert.deepEqual(journalTags, migrationFiles);
  assert.deepEqual(
    journal.entries.map(({ idx }) => idx),
    journal.entries.map((_, index) => index),
  );
});
