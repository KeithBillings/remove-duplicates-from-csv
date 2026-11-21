#!/usr/bin/env node

// Entry point for the `remove-csv-duplicates` command.
// Deliberately written in old-fashioned JavaScript (var, no arrow functions)
// so that even very old Node versions can read it far enough to show a helpful
// message instead of a confusing crash.

var major = Number(process.versions.node.split(".")[0]);

if (major < 20) {
  console.error(
    "remove-csv-duplicates 2.x needs Node.js 20 or newer (you have " + process.version + ").\n" +
      "Use version 1 instead, which supports older Node versions:\n\n" +
      "  npx remove-csv-duplicates@1\n"
  );
  process.exit(1);
}

require("./lib/cli")
  .main()
  .catch(function (err) {
    console.error("Error: " + err.message);
    process.exitCode = 1;
  });
