# CSV Duplicate Remover

[![npm](https://img.shields.io/npm/v/remove-csv-duplicates)](https://www.npmjs.com/package/remove-csv-duplicates)

> **This is the 1.x line, for Node.js 10 to 19.** On Node 20 or newer, use the current version (2.x) instead. See [Which version should I use?](#which-version-should-i-use)

A small command-line tool that removes duplicate rows from a CSV file based on one column. The first row for each value is kept, and everything else stays in its original order.

## Features

- **Any CSV**: any number of columns. Quoted values with commas or line breaks are handled.
- **Arguments or prompts**: pass everything on the command line, or leave things out and you'll be asked.
- **Helpful checks**: lists the available columns and tells you clearly when a file or column doesn't exist.
- **Excel-friendly**: handles the hidden "byte order mark" Excel adds to UTF-8 CSVs, and `.CSV` in capitals.
- **Progress bar** for large files.

## Which version should I use?

There are two maintained versions with the same features and options:

| Your Node.js version | Use                    | Run with                        | Install with                          |
| -------------------- | ---------------------- | ------------------------------- | ------------------------------------- |
| 20 or newer          | **2.x** (the default)  | `npx remove-csv-duplicates`     | `npm install remove-csv-duplicates`   |
| 10 to 19             | **1.x**                | `npx remove-csv-duplicates@1`   | `npm install remove-csv-duplicates@1` |

Not sure? Run `node --version`. If you run 2.x on an older Node, it tells you to switch to 1.x.

The `@1` part asks npm for the newest 1.x release, so you still get bug fixes.

## Usage

Run it without installing anything:

```bash
npx remove-csv-duplicates@1 contacts.csv contacts-clean.csv --column email
```

Or leave out any of the arguments to be prompted for them:

```bash
npx remove-csv-duplicates@1
```

```text
Enter the input file name (must be a .csv file): contacts.csv
Enter the output file name: contacts-clean
Columns: name, email, city
Enter the column to parse (remove duplicates): email
████████████████████████████████████████ 100%
CSV file written without duplicates! Kept 3 of 5 rows (2 duplicates removed) → contacts-clean.csv
```

### Options

| Option                | Description                                        |
| --------------------- | -------------------------------------------------- |
| `-c, --column <name>` | Column to check for duplicates (case-sensitive)    |
| `-e, --remove-empty`  | Also remove rows where that column is empty        |
| `-h, --help`          | Show help                                          |
| `-v, --version`       | Show the version number                            |

Notes:

- File paths can be relative to the folder you run the command in (`data/file.csv`, `../file.csv`) or absolute.
- `.csv` is added to the output name if you leave it off. An existing output file is overwritten.
- Rows where the column is empty (or only spaces) are never treated as duplicates and are kept as they are. Add `--remove-empty` to drop them instead.

### Installing into a project

```bash
npm install --save-dev remove-csv-duplicates@1
```

Then use it from an npm script in your `package.json`:

```json
"scripts": {
  "dedupe": "remove-csv-duplicates data/contacts.csv data/contacts-clean.csv --column email"
}
```

### Using it from code

```js
const { removeDuplicates } = require("remove-csv-duplicates");

const { total, kept, duplicatesRemoved, emptyRemoved } = await removeDuplicates({
  input: "contacts.csv",
  output: "contacts-clean.csv",
  column: "email",
  removeEmpty: false, // optional
});
```

## Development

```bash
npm install
npm test
```

The 1.x code supports Node 10+, but the test runner needs Node 18+. To run the CLI tests against an older Node, set `TEST_NODE` to its path:

```bash
TEST_NODE=/path/to/node10/bin/node npm test
```

## Contributing

Feel free to fork, improve, open pull requests or file issues. I'll be glad to fix bugs you spot or consider your improvements.

## License

[MIT](LICENSE)
