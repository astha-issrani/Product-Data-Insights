// runAnalysis.js

// 1. Import all necessary functions from your scripts/ directory
const { loadAllData } = require('./scripts/dataloader'); // Imports the orchestrator function
const { integrateData } = require('./scripts/integrator');
const { analyzeData } = require('./scripts/analyzer');
const { writeOutput } = require('./scripts/utils'); // Properly import writeOutput from utils.js

// 2. Define the main function to run the pipeline
async function main(baseDir = './data') { // Optional: Allow custom baseDir for data files
    try {
        console.log("Starting data analysis pipeline...");
        
        // A. Load and Process All Data Sources
        // Pass baseDir to loadAllData (e.g., './data' if files are in subdir; '.' for root)
        const { 
            catalog, 
            inventory, 
            metrics, 
            processedMarketplace, 
            competitorIntelligence 
        } = await loadAllData(baseDir); 
        
        console.log("Data loaded successfully.");
        console.log(`Competitor intelligence available: ${!!competitorIntelligence}`);

        // B. Integrate Data into Master Catalog
        const masterArray = integrateData(
            catalog, 
            inventory, 
            metrics, 
            processedMarketplace
        );
        console.log(`Data integrated: ${masterArray.length} products in master catalog.`);

        // C. Analyze and Generate Insights
        // Pass the contextual competitorIntelligence data to the analyzer for every product
        // If competitorIntelligence is null, analyzer will fallback to per-product data or defaults
        const finalResults = masterArray.map(product => 
            analyzeData(product, competitorIntelligence || {}) // Ensure it's an object
        );
        console.log("Analysis complete.");

        // D. Write Final Report
        const outputPath = './outputs/analysis_report.json';
        writeOutput(finalResults, outputPath);

    } catch (error) {
        // Log the error and stop execution gracefully
        console.error("An error occurred during the analysis pipeline:", error);
        console.error("Stack trace:", error.stack);
        
        // Optional: Exit with code 1 for scripting
        process.exit(1);
    }
}

// 3. Execute the pipeline
// Run with default './data' dir; change to '.' if files are in project root
main('./data'); // Or main('.') if no subdir