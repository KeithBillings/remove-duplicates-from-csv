// Run with `npm test`. Uses Node's built-in test runner (no extra dependencies),
// so running the tests needs Node 18+. The package itself supports Node 10+:
// to run the CLI tests against an older Node, point TEST_NODE at it, e.g.
//   TEST_NODE=~/.nvm/versions/node/v10.24.1/bin/node npm test

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const { removeDuplicates, ColumnNotFoundError } = require("../lib/remove-duplicates");

const CLI = path.join(__dirname, "..", "remove-csv-duplicates.js");
const NODE = process.env.TEST_NODE || process.execPath;

const PEOPLE = `name,email,city
Ada,ada@example.com,London
Grace,grace@example.com,"Arlington, VA"
Ada Again,ada@example.com,Paris
Linus,linus@example.com,Helsinki
Grace,grace@example.com,"Arlington, VA"
`;

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "rcd-test-"));
});

/** Write a file into the temp folder and return its path. */
const write = (name, contents) => {
  const file = path.join(dir, name);
  fs.writeFileSync(file, contents);
  return file;
};
const read = (name) => fs.readFileSync(path.join(dir, name), "utf8");

test("keeps the first row for each value and preserves order", async () => {
  const input = write("people.csv", PEOPLE);
  const output = path.join(dir, "out.csv");

  const result = await removeDuplicates({ input, output, column: "email" });

  assert.deepEqual(result, { total: 5, kept: 3, duplicatesRemoved: 2, emptyRemoved: 0 });
  assert.equal(
    read("out.csv"),
    `name,email,city
Ada,ada@example.com,London
Grace,grace@example.com,"Arlington, VA"
Linus,linus@example.com,Helsinki
`
  );
});

test("rejects a column that doesn't exist instead of writing a near-empty file", async () => {
  const input = write("people.csv", PEOPLE);
  const output = path.join(dir, "out.csv");

  await assert.rejects(removeDuplicates({ input, output, column: "Email" }), ColumnNotFoundError);
  assert.equal(fs.existsSync(output), false);
});

test("handles Excel's byte order mark on the first header", async () => {
  const input = write("bom.csv", "\uFEFF" + PEOPLE);
  const output = path.join(dir, "out.csv");

  const result = await removeDuplicates({ input, output, column: "name" });

  assert.equal(result.kept, 4);
  assert.ok(read("out.csv").startsWith("name,email,city\n"));
});

test("a header-only file produces a header-only output", async () => {
  const input = write("empty-rows.csv", "a,b\n");
  const output = path.join(dir, "out.csv");

  const result = await removeDuplicates({ input, output, column: "a" });

  assert.deepEqual(result, { total: 0, kept: 0, duplicatesRemoved: 0, emptyRemoved: 0 });
  assert.equal(read("out.csv"), "a,b\n");
});

const WITH_EMPTY = `name,email
Ada,ada@example.com
NoEmail1,
NoEmail2,"  "
Ada Again,ada@example.com
Short
`;

test("rows with an empty value are kept untouched by default", async () => {
  const input = write("empty.csv", WITH_EMPTY);
  const output = path.join(dir, "out.csv");

  const result = await removeDuplicates({ input, output, column: "email" });

  assert.deepEqual(result, { total: 5, kept: 4, duplicatesRemoved: 1, emptyRemoved: 0 });
  assert.equal(read("out.csv"), 'name,email\nAda,ada@example.com\nNoEmail1,\nNoEmail2,  \nShort,\n');
});

test("removeEmpty drops rows with an empty value", async () => {
  const input = write("empty.csv", WITH_EMPTY);
  const output = path.join(dir, "out.csv");

  const result = await removeDuplicates({ input, output, column: "email", removeEmpty: true });

  assert.deepEqual(result, { total: 5, kept: 1, duplicatesRemoved: 1, emptyRemoved: 3 });
  assert.equal(read("out.csv"), "name,email\nAda,ada@example.com\n");
});

test("CLI: --remove-empty flag", () => {
  write("empty.csv", WITH_EMPTY);
  const stdout = execFileSync(NODE, [CLI, "empty.csv", "out.csv", "-c", "email", "--remove-empty"], { cwd: dir, encoding: "utf8" });

  assert.match(stdout, /Kept 1 of 5 rows \(1 duplicates removed, 3 empty removed\)/);
});

test("CLI: works fully non-interactively with arguments", () => {
  write("people.csv", PEOPLE);
  const stdout = execFileSync(NODE, [CLI, "people.csv", "clean", "--column", "email"], { cwd: dir, encoding: "utf8" });

  assert.match(stdout, /Kept 3 of 5 rows/);
  assert.ok(fs.existsSync(path.join(dir, "clean.csv")), "adds .csv to the output name");
});

test("CLI: answers piped to the prompts all at once are not lost", () => {
  write("people.csv", PEOPLE);
  const stdout = execFileSync(NODE, [CLI], { cwd: dir, encoding: "utf8", input: "people.csv\nout.csv\nemail\n" });

  assert.match(stdout, /Columns: name, email, city/);
  assert.match(stdout, /Kept 3 of 5 rows/);
});

test("CLI: missing file and bad column give a short error and exit code 1", () => {
  write("people.csv", PEOPLE);
  for (const args of [["nope.csv", "out.csv", "-c", "email"], ["people.csv", "out.csv", "-c", "Email"]]) {
    const run = spawnSync(NODE, [CLI, ...args], { cwd: dir, encoding: "utf8" });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /^Error: (File not found|Column "Email" not found)/);
    assert.doesNotMatch(run.stderr, /at .*\(node:/, "no stack trace");
  }
});
