#!/usr/bin/env node

// Command-line entry point. Anything not given as an argument is asked for
// interactively, so `npx remove-csv-duplicates` with no arguments behaves the
// way it always has.
//
// This is the 1.x line, which supports Node.js 10 and newer, so it parses
// arguments by hand instead of using util.parseArgs (added in Node 18.3).

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const ProgressBar = require("progress");
const lib = require("./lib/remove-duplicates");
const version = require("./package.json").version;

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

/**
 * A small argument parser supporting the same options as 2.x:
 * positionals, -c <name>, --column <name>, --column=<name>, -e, -h, -v, and "--".
 */
function parseArguments(argv) {
  const result = { positionals: [], column: undefined, removeEmpty: false, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--") {
      result.positionals = result.positionals.concat(argv.slice(i + 1));
      break;
    } else if (arg === "-c" || arg === "--column") {
      if (i + 1 >= argv.length) throw new Error(`Option '${arg}' needs a column name.`);
      result.column = argv[++i];
    } else if (arg.indexOf("--column=") === 0) {
      result.column = arg.slice("--column=".length);
    } else if (arg === "-e" || arg === "--remove-empty") {
      result.removeEmpty = true;
    } else if (arg === "-h" || arg === "--help") {
      result.help = true;
    } else if (arg === "-v" || arg === "--version") {
      result.version = true;
    } else if (arg.charAt(0) === "-" && arg !== "-") {
      throw new Error(`Unknown option '${arg}'. Run with --help to see the options.`);
    } else {
      result.positionals.push(arg);
    }
  }
  return result;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));

  if (args.help) return console.log(HELP);
  if (args.version) return console.log(version);

  let input = args.positionals[0];
  let output = args.positionals[1];
  let column = args.column;
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
    const headers = await lib.readHeaders(input);
    if (headers.length === 0) throw new Error(`"${input}" is empty. Expected a header row.`);
    const checkColumn = (c) =>
      headers.indexOf(c) !== -1 ? null : `Column "${c}" not found. Available columns: ${headers.join(", ")}`;
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
  const result = await lib.removeDuplicates({
    input: input,
    output: output,
    column: column,
    removeEmpty: args.removeEmpty,
    onProgress: bar ? (read, total) => bar.update(total ? read / total : 1) : undefined,
  });

  let removed = `${result.duplicatesRemoved} duplicates removed`;
  if (args.removeEmpty) removed += `, ${result.emptyRemoved} empty removed`;
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
 * Line-by-line prompts. Lines are queued as they arrive, so answers piped in
 * all at once aren't lost:
 *   printf 'in.csv\nout.csv\nemail\n' | remove-csv-duplicates
 */
function createPrompt() {
  let rl = null;
  const queued = []; // lines that arrived before we asked for them
  let waiting = null; // the pending ask's { resolve, reject }
  let ended = false;

  function start() {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", (line) => {
      if (waiting) {
        const w = waiting;
        waiting = null;
        w.resolve(line);
      } else {
        queued.push(line);
      }
    });
    rl.on("close", () => {
      ended = true;
      if (waiting) waiting.reject(new Error("No more input. Cancelled."));
    });
  }

  function nextLine() {
    if (queued.length > 0) return Promise.resolve(queued.shift());
    if (ended) return Promise.reject(new Error("No more input. Cancelled."));
    return new Promise((resolve, reject) => {
      waiting = { resolve: resolve, reject: reject };
    });
  }

  async function ask(question) {
    if (!rl) start();
    process.stdout.write(question);
    const answer = await nextLine();
    if (!process.stdin.isTTY) process.stdout.write("\n"); // piped answers aren't echoed
    return answer.trim();
  }

  async function askUntilValid(question, check) {
    for (;;) {
      const answer = await ask(question);
      const problem = check(answer);
      if (!problem) return answer;
      console.log(problem);
    }
  }

  return {
    askUntilValid: askUntilValid,
    close: () => {
      if (rl) rl.close();
    },
  };
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
});
