// scripts/analyzer.js

function analyzeData(product, competitorContext) {
    // 1. Calculate Risk (Using inventory/performance metrics)
    
    // FIX: Use optional chaining (?.) to safely access nested properties
    const currentStock = parseFloat(product.performance_metrics?.current_stock || 0);
    const salesVelocity = parseFloat(product.performance_metrics?.sales_velocity || 0);

    // High Risk: Low stock AND high velocity
    let risk_score = 0;
    if (currentStock < 20 && salesVelocity > 100) {
        risk_score = 10;
    }
    
    // 2. Calculate Opportunity (Using pricing from catalog vs. competitor context)
    
    // FIX: Ensure internalPrice is a safe number
    const internalPrice = parseFloat(product.price || 0); 
    
    // FIX: Ensure competitorContext exists before accessing its signals
    const priceErosion = competitorContext?.market_signals?.price_erosion_rate || 0; 
    
    let opportunity_score = 0;
    // The comparison will now work correctly even if product.price was missing.
    if (internalPrice > 0 && internalPrice < 150 && priceErosion < 0.05) {
        opportunity_score = 10;
    }

    // --- You must define 'priority' and 'recommendation' before returning them ---
    let priority = 'Low';
    let recommendation = 'Monitor';

    if (risk_score + opportunity_score >= 15) {
        priority = 'High';
        recommendation = 'URGENT REVIEW: Stock & Price';
    } else if (risk_score > 0) {
        priority = 'Medium';
        recommendation = 'Restock Inventory';
    }

    // 4. Return the enhanced product object
    return {
        ...product,
        priority: priority,
        recommendation: recommendation,
        risk_score: risk_score,
        opportunity_score: opportunity_score
    };
}
module.exports = { analyzeData };