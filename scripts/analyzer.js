// scripts/analyzer.js

function analyzeData(product, competitorContext) {
    // Helper: Safely parse float, default to 0
    const safeParseFloat = (value) => parseFloat(value) || 0;

    // 1. Calculate Risk (Using aggregated inventory metrics from integrator)
    // FIX: Use top-level aggregated fields (current_stock and sales_velocity) added by integrator.js
    const currentStock = safeParseFloat(product.current_stock);
    const salesVelocity = safeParseFloat(product.sales_velocity);

    // High Risk: Low stock AND high velocity (thresholds from framework: stock <20, velocity >100 units)
    let risk_score = 0;
    if (currentStock < 20 && salesVelocity > 100) {
        risk_score = 10;
    }

    // 2. Calculate Opportunity (Using pricing from catalog vs. competitor context)
    // FIX: Use 'suggested_retail' instead of non-existent 'price'
    const internalPrice = safeParseFloat(product.suggested_retail);

    // FIX: Get price_erosion_rate from competitorContext (global) with fallback to product.marketplace_snapshot
    // Assume erosion_rate is in percent (e.g., 3 for 3%), so threshold <5
    let priceErosion = 0;
    if (competitorContext?.market_signals?.price_erosion_rate !== undefined) {
        priceErosion = safeParseFloat(competitorContext.market_signals.price_erosion_rate);
    } else if (product.marketplace_snapshot?.price_erosion_rate !== undefined) {
        priceErosion = safeParseFloat(product.marketplace_snapshot.price_erosion_rate);
    }

    let opportunity_score = 0;
    // Opportunity: Internal price <150 AND low market price erosion (<5%)
    if (internalPrice > 0 && internalPrice < 150 && priceErosion < 5) {
        opportunity_score = 10;
    }

    // 3. Calculate Priority and Recommendation based on total score
    // FIX: Improved logic - Use total score for priority (not just risk)
    // High: Total >=15 (both or more)
    // Medium: Total ==10 (one condition met)
    // Low: Total ==0
    const totalScore = risk_score + opportunity_score;
    let priority = 'Low';
    let recommendation = 'Monitor';

    if (totalScore >= 15) {
        priority = 'High';
        recommendation = 'URGENT REVIEW: Address Stockout Risk and Price Erosion';
    } else if (totalScore === 10) {
        if (risk_score === 10) {
            priority = 'Medium';
            recommendation = 'Restock Inventory (High Sales Velocity Detected)';
        } else if (opportunity_score === 10) {
            priority = 'Medium';
            recommendation = 'Optimize Pricing (Favorable Market Opportunity)';
        }
    } else if (totalScore > 0) {
        // Partial scores if you add more granular (e.g., 5 points), but for now, treat as low
        priority = 'Low';
        recommendation = 'Monitor Closely';
    }

    // 4. Return the enhanced product object
    return {
        ...product,
        priority: priority,
        recommendation: recommendation,
        risk_score: risk_score,
        opportunity_score: opportunity_score,
        total_score: totalScore // Optional: Add for debugging/insights
    };
}

module.exports = { analyzeData };