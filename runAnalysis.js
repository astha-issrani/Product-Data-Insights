// runAnalysis.js
// main.js or integrator.js

async function loadAllData() {
    const [catalog, inventory, metrics] = await Promise.all([
        loadCSV('./internal_catalog_dump.csv'),
        loadCSV('./inventory_movements.csv'),
        loadCSV('./performance_metrics.csv')
    ]);

    // JSON files are loaded sequentially, but processing is handled below
    const competitorIntelligence = loadJSON('./competitor_intelligence.json');
    const marketplaceSnapshot = loadJSON('./marketplace_snapshot.json');
    
    // Process and flatten the marketplace snapshot immediately
    const processedMarketplace = processMarketplaceSnapshot(marketplaceSnapshot); 

    // Return the variables ready for merging and analysis
    return {
        catalog, 
        inventory, 
        metrics, 
        processedMarketplace, 
        competitorIntelligence // This remains separate!
    };
}

// 1. Import all necessary functions from your scripts/ directory
const { loadAllData } = require('./scripts/dataloader'); // Assuming loadAllData is exported
const { integrateData } = require('./scripts/integrator');
const { analyzeData } = require('./scripts/analyzer'); // Assuming this exists
const { writeOutput } = require('./scripts/utils'); // Assuming a utility function exists

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
        const finalResults = masterArray.map(product => 
            analyzeData(product, competitorIntelligence) // Pass context data here
        );
        console.log("Analysis complete.");

        // D. Write Final Report
        writeOutput(finalResults, './outputs/analysis_report.json');
        console.log("Report saved to outputs/analysis_report.json");

    } catch (error) {
        console.error("An error occurred during the analysis pipeline:", error);
    }
}

// 3. Execute the pipeline
main();