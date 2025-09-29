// scripts/integrator.js

function createBaseCatalog(catalogData) {
    const masterCatalog = new Map();
    
    // Build the base structure using the internal catalog
    catalogData.forEach(item => {
        const productId = item.product_id;
        
        masterCatalog.set(productId, {
            ...item,
            inventory_movements: [],  // For merging inventory history
            performance_metrics: {}, 
            marketplace_snapshot: {}
        });
    });
    return masterCatalog;
}

function integrateData(catalog, inventory, metrics, marketplace) {
    const masterCatalog = createBaseCatalog(catalog);
    
    // Merge Inventory Movements (Many-to-one relationship)
    inventory.forEach(item => {
        const productId = item.product_id;
        if (masterCatalog.has(productId)) {
            masterCatalog.get(productId).inventory_movements.push(item);
        }
    });

    // Merge Performance Metrics (One-to-one relationship)
    metrics.forEach(item => {
        const productId = item.product_id;
        if (masterCatalog.has(productId)) {
            masterCatalog.get(productId).performance_metrics = item;
        }
    });

    // Merge Processed Marketplace Snapshot Data
    marketplace.forEach(item => {
        const productId = item.product_id;
        if (masterCatalog.has(productId)) {
            masterCatalog.get(productId).marketplace_snapshot = item;
        }
    });

    // Return final data structure as an array
    return Array.from(masterCatalog.values()); 
}

module.exports = { integrateData }; // Export the main integration function