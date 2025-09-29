// runAnalysis.js

// 1. Import all necessary functions from your scripts/ directory
const { loadAllData } = require('./scripts/dataloader'); // Imports the orchestrator function
const { integrateData } = require('./scripts/integrator');
const { analyzeData } = require('./scripts/analyzer'); // You must create this file and export analyzeData
const { writeOutput } = require('./scripts/utils'); // You must create this file and export writeOutput

// 2. Define the main function to run the pipeline
async function main() {
    try {
        console.log("Starting data analysis pipeline...");
        
        // A. Load and Process All Data Sources
        const { 
            catalog, 
            inventory, 
            metrics, 
            processedMarketplace, 
            competitorIntelligence 
        } = await loadAllData(); 
        console.log("Data loaded successfully.");

        // B. Integrate Data into Master Catalog
        const masterArray = integrateData(
            catalog, 
            inventory, 
            metrics, 
            processedMarketplace
        );
        console.log("Data integrated into Master Catalog.");

        // C. Analyze and Generate Insights
        // Pass the contextual competitorIntelligence data to the analyzer for every product
        const finalResults = masterArray.map(product => 
            analyzeData(product, competitorIntelligence) 
        );
        console.log("Analysis complete.");

        // D. Write Final Report
        writeOutput(finalResults, './outputs/analysis_report.json');
        console.log("Report saved to outputs/analysis_report.json");

    } catch (error) {
        // Log the error and stop execution gracefully
        console.error("An error occurred during the analysis pipeline:", error);
    }
}

// 3. Execute the pipeline
main();