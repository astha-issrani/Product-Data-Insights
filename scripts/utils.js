// scripts/utils.js

const fs = require('fs');

function writeOutput(data, fileName) {
    const jsonOutput = JSON.stringify(data, null, 2);
    fs.writeFileSync(fileName, jsonOutput);
}

module.exports = { writeOutput };