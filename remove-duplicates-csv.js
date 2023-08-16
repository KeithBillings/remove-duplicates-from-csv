const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const inputFile = "coder_winners_b2e93c2c-1b36-11ee-aca6-359e6fb87140.csv";
const outputFile = "output_without_duplicates.csv";

const records = [];

fs.createReadStream(inputFile)
	.pipe(csv())
	.on("data", (row) => {
		// Removing duplicates based on 'email'
		if (!records.find((record) => record.email === row.email)) {
			records.push(row);
		}
	})
	.on("end", () => {
		const csvWriter = createCsvWriter({
			path: outputFile,
			header: Object.keys(records[0]).map((key) => ({ id: key, title: key })),
		});

		csvWriter.writeRecords(records).then(() => console.log("CSV file written without duplicates."));
	});
