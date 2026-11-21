# CSV Duplicate Remover

[![npm](https://img.shields.io/npm/v/remove-csv-duplicates)](https://www.npmjs.com/package/remove-csv-duplicates)

A small command-line tool that removes duplicate rows from a CSV file based on one column. The first row for each value is kept, and everything else stays in its original order.

## Features

- **Any CSV**: any number of columns. Quoted values with commas or line breaks are handled.
- **Arguments or prompts**: pass everything on the command line, or leave things out and you'll be asked.
- **Helpful checks**: lists the available columns and tells you clearly when a file or column doesn't exist.
- **Excel-friendly**: handles the hidden "byte order mark" Excel adds to UTF-8 CSVs, and `.CSV` in capitals.
- **Progress bar** for large files.

## Requirements

- Node.js 20 or newer

## Usage

Run it without installing anything:

```bash
npx remove-csv-duplicates contacts.csv contacts-clean.csv --column email
```

Or leave out any of the arguments to be prompted for them:

```bash
npx remove-csv-duplicates
```

```text
Enter the input file name (must be a .csv file): contacts.csv
Enter the output file name: contacts-clean
Columns: name, email, city
Enter the column to parse (remove duplicates): email
████████████████████████████████████████ 100%
CSV file written without duplicates! Kept 3 of 5 rows (2 removed) → contacts-clean.csv
```

### Options

| Option                | Description                                        |
| --------------------- | -------------------------------------------------- |
| `-c, --column <name>` | Column to check for duplicates (case-sensitive)    |
| `-h, --help`          | Show help                                          |
| `-v, --version`       | Show the version number                            |

Notes:

- File paths can be relative to the folder you run the command in (`data/file.csv`, `../file.csv`) or absolute.
- `.csv` is added to the output name if you leave it off. An existing output file is overwritten.
- Rows where the column is empty count as duplicates of each other, so only the first one is kept.

### Installing into a project

```bash
npm install --save-dev remove-csv-duplicates
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

const { total, kept, removed } = await removeDuplicates({
  input: "contacts.csv",
  output: "contacts-clean.csv",
  column: "email",
});
```

## Development

```bash
npm install
npm test
```

## Contributing

Feel free to fork, improve, open pull requests or file issues. I'll be glad to fix bugs you spot or consider your improvements.

## License

[MIT](LICENSE)
