#!/usr/bin/env node

// Import required modules
const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const readline = require("readline");
const ProgressBar = require("progress");

// Create a readline interface for taking user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask for the input file, with validation for .csv extension
const askForInputFile = (callback) => {
  rl.question("Enter the input file name (must be a .csv file): ", (inputFile) => {
    if (inputFile.endsWith(".csv")) {
      callback(inputFile); // Call the provided callback with the input file
    } else {
      console.log("Please enter a valid CSV file.");
      askForInputFile(callback); // Recursive call if input is not valid
    }
  });
};

// Start by asking for the input file
askForInputFile((inputFile) => {
  // Ask for the output file name
  rl.question("Enter the output file name: ", (outputFileName) => {
    // Append .csv to the output file name if not present
    const outputFile = outputFileName.endsWith(".csv") ? outputFileName : outputFileName + ".csv";

    // Ask for the column to parse
    rl.question("Enter the column to parse (remove duplicates): ", (column) => {
      const records = []; // Array to hold unique records
      let bar = { total: 0 }; // Initialize progress bar object

      // Read the input file to count lines (for progress bar)
      fs.createReadStream(inputFile)
        .on("data", (chunk) => {
          for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === "\n".charCodeAt(0)) bar.total++; // Increment count for each newline character
          }
        })
        .on("end", () => {
          // Create progress bar with the total line count
          bar = new ProgressBar(":bar :percent", { total: bar.total, width: 40 });

          // Read the input file again and parse with csv-parser
          fs.createReadStream(inputFile)
            .pipe(csv())
            .on("data", (row) => {
              // If record does not exist, add to records array
              if (!records.find((record) => record[column] === row[column])) {
                records.push(row);
              }
              bar.tick(); // Update the progress bar
            })
            .on("end", () => {
              // Define CSV writer with the output file path and headers
              const csvWriter = createCsvWriter({
                path: outputFile,
                header: Object.keys(records[0]).map((key) => ({ id: key, title: key })),
              });

              // Write the unique records to the output file
              csvWriter.writeRecords(records).then(() => {
                console.log("CSV file written without duplicates!");
                rl.close(); // Close the readline interface
              });
            });
        });
    });
  });
});
