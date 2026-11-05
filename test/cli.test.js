import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
const run = (...args) =>
  execFileSync(process.execPath, ["cli.js", ...args], { encoding: "utf8" });
test("help and list expose commands without network access", () => {
  for (const option of ["--list", "-list", "list", "--help", "-h"])
    assert.match(run(option), /fight this weekend/);
});
test("version options match package version", () => {
  const version = JSON.parse(readFileSync("package.json", "utf8")).version;
  for (const option of ["-v", "-V", "--version"])
    assert.equal(run(option).trim(), version);
});
test("unknown options fail with an explanation", () => {
  const result = spawnSync(process.execPath, ["cli.js", "--nonsense"], {
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown option/);
});
