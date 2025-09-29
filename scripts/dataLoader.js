// scripts/dataloader.js

// 1. Consolidate and move all require statements to the top
const fs = require('fs');
const csv = require('csv-parser');
const JSONbig = require('json-bigint');

// Example of a mapping function (You should update this with your actual column names)
const KEY_MAP = {
    'identifier': 'product_id',
    'item_code': 'product_id',
    'sku': 'product_id',
    'asin': 'product_id' // Added 'asin' here for consistency
};

// Helper function to standardize keys across all data arrays
function standardizeKeys(dataArray) {
    if (!dataArray || dataArray.length === 0) return [];
    
    return dataArray.map(item => {
        const newItem = {};
        for (const oldKey in item) {
            // Find the new key name, or use the original key
            const newKey = KEY_MAP[oldKey.trim()] || oldKey;
            
            // Trim whitespace from the key value and assign it
            newItem[newKey.trim()] = item[oldKey];
        }
        return newItem;
    });
}

// Function to load and parse a CSV file (returns a Promise)
function loadCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // Standardize keys right after loading and before resolving
                resolve(standardizeKeys(results));
            })
            .on('error', (error) => reject(error));
    });
}

// Function to load and parse a JSON file safely
function loadJSON(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Use JSONbig to safely parse large numbers
        return JSONbig.parse(fileContent);
    } catch (error) {
        console.error(`Error loading JSON from ${filePath}:`, error);
        return null;
    }
}

// Function to flatten and rename keys for the marketplace snapshot
function processMarketplaceSnapshot(snapshot) {
    if (!snapshot || !snapshot.platforms || !snapshot.platforms.amazon) return [];
    
    const amazonProducts = snapshot.platforms.amazon.products;
    
    return amazonProducts.map(product => {
        const newProduct = { ...product }; 
        
        // Use the common standardizeKeys logic if possible, otherwise hardcode renaming
        newProduct.product_id = newProduct.asin; 
        delete newProduct.asin; 

        // Extract nested data
        newProduct.bsr_category = product.best_seller_rank.category;
        newProduct.bsr_rank = product.best_seller_rank.rank;
        delete newProduct.best_seller_rank;
        
        return newProduct;
    });
}

// The core orchestrator function
async function loadAllData() {
    // 1. Load CSVs in parallel (efficiency boost)
    const [catalog, inventory, metrics] = await Promise.all([
        loadCSV('./internal_catalog_dump.csv'),
        loadCSV('./inventory_movements.csv'),
        loadCSV('./performance_metrics.csv')
    ]);

    // 2. Load and Process JSON files
    const competitorIntelligence = loadJSON('./competitor_intelligence.json');
    const marketplaceSnapshot = loadJSON('./marketplace_snapshot.json');
    
    // Process the marketplace snapshot (flatten and rename keys)
    const processedMarketplace = processMarketplaceSnapshot(marketplaceSnapshot); 

    // 3. Return all data required by the integrator and analyzer
    return {
        catalog, 
        inventory, 
        metrics, 
        processedMarketplace, 
        competitorIntelligence // Contextual data remains separate
    };
}

// Export the main orchestration function for runAnalysis.js to use
module.exports = {
    loadAllData
    // You can optionally export other helper functions for unit testing
};