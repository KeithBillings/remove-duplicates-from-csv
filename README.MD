# CSV Duplicate Remover

A simple and versatile Node.js script to remove duplicate entries from a CSV file based on a specific column. It includes a progress bar to visually track the processing and utilizes the command line for easy input.

## Features

- **CSV Input**: Accepts a CSV file with any number of columns.
- **Duplicate Removal**: Removes duplicate entries based on the specified column.
- **User-Friendly CLI**: Asks for the input file, output file, and target column via the command line.
- **Progress Bar**: Shows a progress bar during processing.
- **Validation**: Checks if the input file is a CSV file.

## Requirements

- Node.js
- npm

## Installation

1. Clone the repository or download the script.
2. Navigate to the directory containing the script.
3. Run the following command to install the necessary dependencies:

```bash
npm install
```

This will install all the dependencies declared in the `package.json` file.

## Dependencies

- [csv-parser](https://www.npmjs.com/package/csv-parser)
- [csv-writer](https://www.npmjs.com/package/csv-writer)
- [progress](https://www.npmjs.com/package/progress)

## Usage

To run the script, simply execute the following command in the directory containing the script:

```bash
node <script_name.js>
```

Replace `<script_name.js>` with the name of the script file.

The script will then prompt you for the input file name (must be a .csv file), output file name, and the column to parse for removing duplicates.

## Contributing

Feel free to fork, improve, make pull requests or fill issues. I'll be glad to fix bugs you spotted or consider your improvements.

## License

This project is licensed under the MIT License.
