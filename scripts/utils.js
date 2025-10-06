// scripts/utils.js

const fs = require('fs');
const path = require('path');

/**
 * Writes the given data to a JSON file.
 * - Creates the output directory if it doesn't exist.
 * - Handles BigInt serialization (from json-bigint in dataloader).
 * - Includes error handling and logging.
 * 
 * @param {Array|Object} data - The data to write (e.g., array of products).
 * @param {string} fileName - Full path to the output file (e.g., './outputs/analysis_report.json').
 * @returns {void} - Logs success or error; throws if critical failure.
 */
function writeOutput(data, fileName) {
    try {
        // Validate input
        if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn('writeOutput: No data provided or empty array. Writing empty file.');
            data = []; // Ensure it's an array for consistency
        }

        // Ensure output directory exists (e.g., './outputs/')
        const outputDir = path.dirname(fileName);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`Created output directory: ${outputDir}`);
        }

        // Stringify with indentation for readability; handle bigints
        const jsonString = JSON.stringify(data, (key, value) => 
            typeof value === 'bigint' 
                ? value.toString() 
                : value
        , 2);

        // Write the file
        fs.writeFileSync(fileName, jsonString, 'utf8');
        console.log(`Report saved successfully to: ${fileName}`);
        
        // Optional: Log a quick summary if data is an array of products (for convenience)
        if (Array.isArray(data) && data.length > 0 && data[0].priority) {
            const highPriority = data.filter(p => p.priority === 'High').length;
            const mediumPriority = data.filter(p => p.priority === 'Medium').length;
            const lowPriority = data.filter(p => p.priority === 'Low').length;
            console.log(`Analysis Summary: ${highPriority} High, ${mediumPriority} Medium, ${lowPriority} Low priority products.`);
        } else {
            console.log(`Wrote ${Array.isArray(data) ? data.length : '1'} item(s) to output.`);
        }
        
    } catch (error) {
        console.error(`Error writing output to ${fileName}:`, error);
        console.error('Stack trace:', error.stack);
        
        // Fallback: Log the data to console for debugging
        console.log('Full data (fallback output):', JSON.stringify(data, null, 2));
        
        // Re-throw for runAnalysis to handle (or remove if you want silent fallback)
        throw error;
    }
}

module.exports = { writeOutput };