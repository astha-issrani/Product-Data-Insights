// scripts/integrator.js

function createBaseCatalog(catalogData) {
    const masterCatalog = new Map();
    
    catalogData.forEach(item => {
        const productId = item.product_id;
        
        masterCatalog.set(productId, {
            ...item,
            inventory_movements: [],  // For merging inventory history
            performance_metrics: {}, 
            marketplace_snapshot: {},
            current_stock: 0,        // Aggregated: Latest non-null FBA inventory (min across retailers if multiple)
            sales_velocity: 0        // Aggregated: Sum of units_shipped from recent movements (last 7 days)
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
            // Clean 'null' strings to actual null for better handling
            const cleanedItem = { ...item };
            Object.keys(cleanedItem).forEach(key => {
                if (cleanedItem[key] === 'null') {
                    cleanedItem[key] = null;
                }
            });
            masterCatalog.get(productId).inventory_movements.push(cleanedItem);
        }
    });

    // Merge Performance Metrics (One-to-one relationship)
    metrics.forEach(item => {
        const productId = item.product_id;
        if (masterCatalog.has(productId)) {
            // Clean 'null' strings here too
            const cleanedItem = { ...item };
            Object.keys(cleanedItem).forEach(key => {
                if (cleanedItem[key] === 'null') {
                    cleanedItem[key] = null;
                }
            });
            masterCatalog.get(productId).performance_metrics = cleanedItem;
        }
    });

    // Merge Processed Marketplace Snapshot Data (One-to-one)
    marketplace.forEach(item => {
        const productId = item.product_id;
        if (masterCatalog.has(productId)) {
            masterCatalog.get(productId).marketplace_snapshot = item;
        }
    });

    // Aggregate Inventory Data for Each Product (After Merging)
    masterCatalog.forEach(product => {
        const movements = product.inventory_movements || [];
        if (movements.length > 0) {
            // Get current date for recency filter (hardcoded as today; adjust if needed)
            const today = new Date('2025-10-06'); // Example: Use actual current date in production

            // 1. Current Stock: Latest non-null current_fba_inventory (or min if multiple on same date)
            const validStocks = movements
                .filter(mov => mov.current_fba_inventory !== null && mov.current_fba_inventory !== undefined)
                .map(mov => ({ ...mov, stock: parseFloat(mov.current_fba_inventory) }))
                .filter(mov => !isNaN(mov.stock)); // Valid numbers only

            if (validStocks.length > 0) {
                // Sort by date descending, take the most recent
                const latestStock = validStocks
                    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                product.current_stock = latestStock ? latestStock.stock : 0;

                // If multiple on same latest date, take min (e.g., across retailers)
                const latestDate = new Date(latestStock.date);
                const sameDayStocks = validStocks
                    .filter(mov => new Date(mov.date).toDateString() === latestDate.toDateString())
                    .map(mov => mov.stock);
                if (sameDayStocks.length > 1) {
                    product.current_stock = Math.min(...sameDayStocks);
                }
            }

            // 2. Sales Velocity: Sum of units_shipped from movements in the last 7 days
            const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            const recentMovements = movements
                .filter(mov => {
                    const movDate = new Date(mov.date);
                    return movDate >= sevenDaysAgo && mov.units_shipped !== null && mov.units_shipped !== undefined;
                })
                .map(mov => parseInt(mov.units_shipped) || 0)
                .filter(units => !isNaN(units));

            product.sales_velocity = recentMovements.reduce((sum, units) => sum + units, 0);
        }
        // If no movements, defaults remain 0
    });

    // Return final data structure as an array
    return Array.from(masterCatalog.values()); 
}

module.exports = { integrateData }; // Export the main integration function