//Data Loading and Cleaning : This module will handle asynchronous file operations.
const fs = require('fs');
const csv = require('csv-parser');

// Example of a mapping function
const KEY_MAP = {
    'identifier': 'product_id',
    'item_code': 'product_id',
    'sku': 'product_id',
    // ... add mappings for JSON keys if needed
    'old_name': 'new_name'
};

function standardizeKeys(dataArray) {
    return dataArray.map(item => {
        const newItem = {};
        for (const oldKey in item) {
            // Rename the key if a mapping exists, otherwise use the original key
            const newKey = KEY_MAP[oldKey] || oldKey;
            
            // Trim whitespace and assign the value
            // Trim() is essential for keys like ' product_id '
            newItem[newKey.trim()] = item[oldKey];
        }
        return newItem;
    });
}

function processMarketplaceSnapshot(snapshot) {
    const amazonProducts = snapshot.platforms.amazon.products;
    
    // Flatten and rename the 'asin' key to 'product_id'
    return amazonProducts.map(product => {
        // Create a new object to avoid modifying the original structure
        const newProduct = { ...product }; 
        
        // 1. Rename 'asin' to 'product_id'
        newProduct.product_id = newProduct.asin;
        delete newProduct.asin; // Optional: remove the old key

        // 2. Extract or simplify other nested data (e.g., Best Seller Rank)
        newProduct.bsr_category = product.best_seller_rank.category;
        newProduct.bsr_rank = product.best_seller_rank.rank;
        delete newProduct.best_seller_rank;
        
        return newProduct;
    });
}
// This function will return a flat array ready for merging.

function loadCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}
// Example usage: const catalogData = await loadCSV('./internal_catalog_dump.csv');

const JSONbig = require('json-bigint');
const fs = require('fs');

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
// Example usage: const competitorData = loadJSON('./competitor_intelligence.json');