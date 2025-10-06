// scripts/dataloader.js

// 1. Consolidate and move all require statements to the top
const fs = require('fs');
const path = require('path');
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
            newItem[newKey.trim()] = (item[oldKey] || '').toString().trim();
        }
        return newItem;
    });
}

// Helper function to clean 'null' strings to actual null/undefined in data
function cleanNullStrings(item) {
    if (!item) return item;
    const cleaned = { ...item };
    Object.keys(cleaned).forEach(key => {
        if (cleaned[key] === 'null' || cleaned[key] === '') {
            cleaned[key] = null;
        } else if (typeof cleaned[key] === 'string') {
            // Optional: Trim all strings
            cleaned[key] = cleaned[key].trim();
        }
    });
    return cleaned;
}

// Function to load and parse a CSV file (returns a Promise)
function loadCSV(filePath) {
    return new Promise((resolve, reject) => {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.warn(`CSV file not found: ${filePath}. Returning empty array.`);
            return resolve([]);
        }

        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // Standardize keys and clean nulls right after loading
                const standardized = standardizeKeys(results);
                const cleaned = standardized.map(cleanNullStrings);
                resolve(cleaned);
            })
            .on('error', (error) => {
                console.error(`Error loading CSV from ${filePath}:`, error);
                reject(error);
            });
    });
}

// Function to load and parse a JSON file safely
function loadJSON(filePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.warn(`JSON file not found: ${filePath}. Returning null.`);
            return null;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        // Use JSONbig to safely parse large numbers
        const parsed = JSONbig.parse(fileContent);
        // If it's an array, standardize and clean
        if (Array.isArray(parsed)) {
            const standardized = standardizeKeys(parsed);
            return standardized.map(cleanNullStrings);
        }
        // If object, clean nulls recursively (simple top-level for now)
        return cleanNullStrings(parsed);
    } catch (error) {
        console.error(`Error loading JSON from ${filePath}:`, error);
        return null;
    }
}

// Function to flatten and rename keys for the marketplace snapshot
function processMarketplaceSnapshot(snapshot) {
    // Robust check for top-level structure
    if (!snapshot || !snapshot.platforms || !snapshot.platforms.amazon) {
        console.warn('Invalid marketplace snapshot structure. Returning empty array.');
        return [];
    }
    
    const amazonProducts = snapshot.platforms.amazon.products;
    if (!amazonProducts || !Array.isArray(amazonProducts)) {
        console.warn('No products found in marketplace snapshot. Returning empty array.');
        return [];
    }

    return amazonProducts.map(product => {
        // Clean the raw product first
        const cleanedProduct = cleanNullStrings({ ...product });
        
        const newProduct = { ...cleanedProduct }; 
        
        // Standardize product_id (asin to product_id)
        if (newProduct.asin) {
            newProduct.product_id = newProduct.asin;
            delete newProduct.asin;
        } else if (!newProduct.product_id) {
            console.warn(`Product missing product_id/asin:`, product);
            newProduct.product_id = null; // Or skip: return null; and filter later
        }

        // Extract nested best_seller_rank with robust checks
        if (cleanedProduct.best_seller_rank) {
            newProduct.bsr_category = cleanedProduct.best_seller_rank.category || null;
            newProduct.bsr_rank = cleanedProduct.best_seller_rank.rank ? parseFloat(cleanedProduct.best_seller_rank.rank) : null;
            delete newProduct.best_seller_rank;
        } else {
            newProduct.bsr_category = null;
            newProduct.bsr_rank = null;
        }

        // FIX: Extract price_erosion_rate if present in raw snapshot (per-product or nested)
        // Assume it might be in product.competitor_data or top-level; adjust based on your JSON structure
        if (cleanedProduct.competitor_data?.price_erosion_rate !== undefined) {
            newProduct.price_erosion_rate = parseFloat(cleanedProduct.competitor_data.price_erosion_rate) || null;
            // Optionally delete nested if not needed
        } else if (cleanedProduct.price_erosion_rate !== undefined) {
            newProduct.price_erosion_rate = parseFloat(cleanedProduct.price_erosion_rate) || null;
        } else {
            newProduct.price_erosion_rate = null; // Default; global will override in analyzer
        }

        // Add other potential fields (e.g., competitor_price_index if in raw)
        if (cleanedProduct.competitor_price_index !== undefined) {
            newProduct.competitor_price_index = parseFloat(cleanedProduct.competitor_price_index) || null;
        }

        return newProduct;
    }).filter(product => product.product_id !== null); // Filter out invalid products
}

// The core orchestrator function
async function loadAllData(baseDir = './data') {
    // Use path.join for cross-platform compatibility
    const catalogPath = path.join(baseDir, 'internal_catalog_dump.csv');
    const inventoryPath = path.join(baseDir, 'inventory_movements.csv');
    const metricsPath = path.join(baseDir, 'performance_metrics.csv');
    const competitorPath = path.join(baseDir, 'competitor_intelligence.json');
    const marketplacePath = path.join(baseDir, 'marketplace_snapshot.json');

    try {
        // 1. Load CSVs in parallel (efficiency boost)
        const [catalog, inventory, metrics] = await Promise.all([
            loadCSV(catalogPath),
            loadCSV(inventoryPath),
            loadCSV(metricsPath)
        ]);

        // 2. Load and Process JSON files
        const competitorIntelligence = loadJSON(competitorPath);
        const rawMarketplaceSnapshot = loadJSON(marketplacePath);
        
        // Process the marketplace snapshot (flatten and rename keys)
        const processedMarketplace = processMarketplaceSnapshot(rawMarketplaceSnapshot); 

        // 3. Validate and Log Loaded Data (for debugging)
        console.log(`Loaded ${catalog.length} catalog items`);
        console.log(`Loaded ${inventory.length} inventory movements`);
        console.log(`Loaded ${metrics.length} performance metrics`);
        console.log(`Loaded ${processedMarketplace.length} marketplace snapshots`);
        console.log(`Competitor intelligence: ${competitorIntelligence ? 'Loaded' : 'Missing'}`);

        // 4. Return all data required by the integrator and analyzer
        return {
            catalog, 
            inventory, 
            metrics, 
            processedMarketplace, 
            competitorIntelligence // Contextual data remains separate (global for analyzer)
        };
    } catch (error) {
        console.error('Error in loadAllData:', error);
        // Return partial data or empty to prevent full crash
        return {
            catalog: [],
            inventory: [],
            metrics: [],
            processedMarketplace: [],
            competitorIntelligence: null
        };
    }
}

// Export the main orchestration function for runAnalysis.js to use
module.exports = {
    loadAllData
    // You can optionally export other helper functions for unit testing
};