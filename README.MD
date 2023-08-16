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
node remove-csv-duplicates.js
```

The script will then prompt you for the input file name (must be a .csv file), output file name, and the column to parse for removing duplicates.

The input file name can be a relative or absolute path. If the file is in the same directory as the script, you can simply enter the file name. Otherwise, you must enter the relative or absolute path to the file. For example, if the file is in a subdirectory called `data`, you can enter `data/file.csv` or `./data/file.csv`. If the file is in a parent directory, you can enter `../file.csv`.

The output file name can be a relative or absolute path. If the file is in the same directory as the script, you can simply enter the file name. Otherwise, you must enter the relative or absolute path to the file. For example, if you want to save the file in a subdirectory called `output`, you can enter `output/file.csv` or `./output/file.csv`. If you want to save the file in a parent directory, you can enter `../file.csv`.

The column to parse for removing duplicates must be a valid column name in the CSV file. The script will display the column names in the CSV file and prompt you to enter the column name. The column name is case-sensitive.

## Contributing

Feel free to fork, improve, make pull requests or fill issues. I'll be glad to fix bugs you spotted or consider your improvements.

## License

This project is licensed under the MIT License.
