// Core logic: read a CSV, keep the first row for each value in one column,
// and write the result. Kept separate from the CLI so it can be tested
// (and used from other code) without any prompts.

const fs = require("node:fs");
const csv = require("csv-parser");
const { createObjectCsvStringifier } = require("csv-writer");

// Excel adds an invisible "byte order mark" (BOM) to the start of UTF-8 CSVs.
// Without stripping it, the first header would never match what you type.
const stripBom = ({ header, index }) => (index === 0 ? header.replace(/^\uFEFF/, "") : header);

/**
 * Remove rows whose value in `column` has already been seen.
 * The first occurrence wins; row order is otherwise preserved.
 *
 * Rows where `column` is empty (or only spaces) are never treated as
 * duplicates. They are kept untouched unless `removeEmpty` is true.
 *
 * @param {object} options
 * @param {string} options.input - Path to the CSV to read.
 * @param {string} options.output - Path to write the de-duplicated CSV to.
 * @param {string} options.column - Header name to de-duplicate on (case-sensitive).
 * @param {boolean} [options.removeEmpty=false] - Also drop rows where `column` is empty.
 * @param {(bytesRead: number, totalBytes: number) => void} [options.onProgress]
 *   Called as the file is read, e.g. to drive a progress bar.
 * @returns {Promise<{ total: number, kept: number, duplicatesRemoved: number, emptyRemoved: number }>}
 */
async function removeDuplicates({ input, output, column, removeEmpty = false, onProgress }) {
  const totalBytes = fs.statSync(input).size; // throws ENOENT if missing

  /** @type {string[]} */
  let headers = [];
  const seen = new Set(); // values of `column` we've already kept
  const kept = [];
  let total = 0;
  let emptyRemoved = 0;

  await new Promise((resolve, reject) => {
    const source = fs.createReadStream(input);
    let bytesRead = 0;
    if (onProgress) {
      source.on("data", (chunk) => {
        bytesRead += chunk.length;
        onProgress(bytesRead, totalBytes);
      });
    }

    const parser = csv({ mapHeaders: stripBom });

    parser
      .on("headers", (h) => {
        headers = h;
        if (!headers.includes(column)) {
          // Stop early instead of silently treating every row as a duplicate.
          parser.destroy(new ColumnNotFoundError(column, headers));
        }
      })
      .on("data", (row) => {
        total++;
        const value = row[column] ?? ""; // short rows have no value at all
        if (value.trim() === "") {
          if (removeEmpty) emptyRemoved++;
          else kept.push(row);
        } else if (!seen.has(value)) {
          seen.add(value);
          kept.push(row);
        }
      })
      .on("end", resolve)
      .on("error", reject);

    source.on("error", reject);
    source.pipe(parser);
  });

  if (headers.length === 0) {
    throw new Error(`"${input}" is empty. Expected a header row.`);
  }

  const stringifier = createObjectCsvStringifier({
    header: headers.map((h) => ({ id: h, title: h })),
  });
  // csv-writer turns zero rows into "\n", which would leave a stray blank line.
  const body = kept.length > 0 ? stringifier.stringifyRecords(kept) : "";
  await fs.promises.writeFile(output, stringifier.getHeaderString() + body);

  return {
    total,
    kept: kept.length,
    duplicatesRemoved: total - kept.length - emptyRemoved,
    emptyRemoved,
  };
}

class ColumnNotFoundError extends Error {
  /**
   * @param {string} column
   * @param {string[]} headers
   */
  constructor(column, headers) {
    super(`Column "${column}" not found. Available columns: ${headers.join(", ")}`);
    this.name = "ColumnNotFoundError";
    this.column = column;
    this.headers = headers;
  }
}

/**
 * Read just the header row of a CSV (used to show the user which columns exist).
 * @param {string} input
 * @returns {Promise<string[]>}
 */
function readHeaders(input) {
  return new Promise((resolve, reject) => {
    const source = fs.createReadStream(input);
    const parser = csv({ mapHeaders: stripBom });
    parser.on("headers", (headers) => {
      source.destroy();
      resolve(headers);
    });
    parser.on("end", () => resolve([])); // empty file
    parser.on("error", reject);
    source.on("error", reject);
    source.pipe(parser);
  });
}

module.exports = { removeDuplicates, readHeaders, ColumnNotFoundError };
