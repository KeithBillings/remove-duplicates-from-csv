const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const readline = require("readline");
const ProgressBar = require("progress");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askForInputFile = (callback) => {
  rl.question("Enter the input file name (must be a .csv file): ", (inputFile) => {
    if (inputFile.endsWith(".csv")) {
      callback(inputFile);
    } else {
      console.log("Please enter a valid CSV file.");
      askForInputFile(callback);
    }
  });
};

askForInputFile((inputFile) => {
  rl.question("Enter the output file name: ", (outputFileName) => {
    const outputFile = outputFileName.endsWith(".csv") ? outputFileName : outputFileName + ".csv";

    rl.question("Enter the column to parse (remove duplicates): ", (column) => {
      const records = [];
      let bar = { total: 0 };

      fs.createReadStream(inputFile)
        .on("data", (chunk) => {
          for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === "\n".charCodeAt(0)) bar.total++;
          }
        })
        .on("end", () => {
          bar = new ProgressBar(":bar :percent", { total: bar.total, width: 40 });

          fs.createReadStream(inputFile)
            .pipe(csv())
            .on("data", (row) => {
              if (!records.find((record) => record[column] === row[column])) {
                records.push(row);
              }
              bar.tick(); // Update the progress bar
            })
            .on("end", () => {
              const csvWriter = createCsvWriter({
                path: outputFile,
                header: Object.keys(records[0]).map((key) => ({ id: key, title: key })),
              });

              csvWriter.writeRecords(records).then(() => {
                console.log("CSV file written without duplicates!");
                rl.close();
              });
            });
        });
    });
  });
});
