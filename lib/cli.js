// The command-line interface. Started by ../remove-csv-duplicates.js after it
// has checked the Node version. Anything not given as an argument is asked for
// interactively, so `npx remove-csv-duplicates` with no arguments behaves the
// way it always has.

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { parseArgs } = require("node:util");
const ProgressBar = require("progress");
const { removeDuplicates, readHeaders } = require("./remove-duplicates");
const { version } = require("../package.json");

const HELP = `Usage: remove-csv-duplicates [input.csv] [output.csv] [--column <name>]

Removes rows from a CSV that repeat a value in one column, keeping the first.
Rows where that column is empty are kept as they are.
Anything you leave out is asked for interactively.

Options:
  -c, --column <name>  Column to check for duplicates (case-sensitive)
  -e, --remove-empty   Also remove rows where that column is empty
  -h, --help           Show this help
  -v, --version        Show the version number

Example:
  remove-csv-duplicates contacts.csv contacts-clean.csv --column email`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      column: { type: "string", short: "c" },
      "remove-empty": { type: "boolean", short: "e" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.help) return console.log(HELP);
  if (values.version) return console.log(version);

  let [input, output] = positionals;
  let column = values.column;
  const prompt = createPrompt();

  try {
    // Input file: given as an argument it must be valid; asked for, we re-ask.
    if (input) {
      const problem = checkInputFile(input);
      if (problem) throw new Error(problem);
    } else {
      input = await prompt.askUntilValid("Enter the input file name (must be a .csv file): ", checkInputFile);
    }

    if (!output) {
      output = await prompt.askUntilValid("Enter the output file name: ", (a) => (a ? null : "Please enter a file name."));
    }
    if (path.extname(output).toLowerCase() !== ".csv") output += ".csv";

    // Column: checked up front so a typo can't produce a nearly empty file.
    const headers = await readHeaders(input);
    if (headers.length === 0) throw new Error(`"${input}" is empty. Expected a header row.`);
    const checkColumn = (c) => (headers.includes(c) ? null : `Column "${c}" not found. Available columns: ${headers.join(", ")}`);
    if (column) {
      const problem = checkColumn(column);
      if (problem) throw new Error(problem);
    } else {
      console.log(`Columns: ${headers.join(", ")}`);
      column = await prompt.askUntilValid("Enter the column to parse (remove duplicates): ", checkColumn);
    }
  } finally {
    prompt.close();
  }

  // Only show the bar in a real terminal, not when output is piped to a file.
  const bar = process.stderr.isTTY ? new ProgressBar(":bar :percent", { total: 100, width: 40 }) : null;
  const result = await removeDuplicates({
    input,
    output,
    column,
    removeEmpty: values["remove-empty"] ?? false,
    onProgress: bar ? (read, total) => bar.update(total ? read / total : 1) : undefined,
  });

  let removed = `${result.duplicatesRemoved} duplicates removed`;
  if (values["remove-empty"]) removed += `, ${result.emptyRemoved} empty removed`;
  console.log(`CSV file written without duplicates! Kept ${result.kept} of ${result.total} rows (${removed}) → ${output}`);
}

/** @returns {string | null} an error message, or null if the file is usable */
function checkInputFile(file) {
  // Case-insensitive: Excel on Windows often saves files as .CSV
  if (path.extname(file).toLowerCase() !== ".csv") return "Please enter a valid CSV file.";
  if (!fs.existsSync(file)) return `File not found: ${file}`;
  if (fs.statSync(file).isDirectory()) return `That's a folder, not a file: ${file}`;
  return null;
}

/**
 * Line-by-line prompts. Reading lines through an async iterator (instead of
 * rl.question) buffers them, so answers piped in all at once aren't lost:
 *   printf 'in.csv\nout.csv\nemail\n' | remove-csv-duplicates
 */
function createPrompt() {
  /** @type {readline.Interface | undefined} */
  let rl;
  /** @type {AsyncIterator<string> | undefined} */
  let lines;

  async function ask(question) {
    if (!rl) {
      rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      lines = rl[Symbol.asyncIterator]();
    }
    process.stdout.write(question);
    const { value, done } = await lines.next();
    if (done) throw new Error("No more input. Cancelled.");
    if (!process.stdin.isTTY) process.stdout.write("\n"); // piped answers aren't echoed
    return value.trim();
  }

  async function askUntilValid(question, check) {
    for (;;) {
      const answer = await ask(question);
      const problem = check(answer);
      if (!problem) return answer;
      console.log(problem);
    }
  }

  return { askUntilValid, close: () => rl?.close() };
}

module.exports = { main };
