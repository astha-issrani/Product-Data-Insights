# README.md
## Product Data Insights Engine
This project implements a data analysis pipeline built using Node.js to integrate five disparate data sources (internal catalog, inventory, performance, and competitor/market data) and generate actionable business recommendations based on a custom priority framework.

## Getting Started
### Prerequisites
Node.js (LTS version)

npm (Node Package Manager)

### Installation and Execution
1. Clone the Repository:

Bash:
git clone https://github.com/astha-issrani/Product-Data-Insights.git
cd Product-Data-Insights

2. Install Dependencies:

Bash

npm install

3. Run the Analysis Pipeline:

Bash

node runAnalysis.js
(The script will execute the full pipeline and save the final report to the outputs/ folder.)

## Analytical Approach
The pipeline is executed sequentially via runAnalysis.js and is divided into three modular stages:

1. Data Loading & Standardization (dataloader.js):

All CSV files are loaded concurrently using Promise.all and csv-parser for efficiency.

JSON files are safely loaded using json-bigint to prevent large numerical IDs from being corrupted.

A standardization layer renames all differing primary keys (e.g., asin, SKU, item_code) to the universal key, product_id.

The marketplace_snapshot is flattened, and nested data is extracted for merging.

2. Data Integration (integrator.js):

A Master Product Catalog is built using a JavaScript Map, indexed by product_id.

Data from four product-specific sources (internal_catalog_dump, inventory_movements, performance_metrics, and marketplace_snapshot) is merged into a single object for each product.

3. Analysis and Recommendation (analyzer.js):

The Master Catalog is iterated over.

The Contextual Data (competitor_intelligence) is passed to the analyzer as a global constant to inform strategic decisions.

The Priority Framework is applied to generate final scores and recommendations.

##  Priority Framework
The priority framework assigns a final priority (High, Medium, Low) and a clear business recommendation based on a combination of Risk and Opportunity scores.

## Factor	Criteria	Score
Risk Score	
Stock is low (< 20 units) AND Sales Velocity is high (> 100 units).	10 pts
Opportunity Score	
Internal Price is competitive (< $150) AND Market Price Erosion is low (< 5%).	10 pts

Total Score	Priority Level	Recommendation
≥15	High	URGENT REVIEW: Stock & Price
 10	Medium	Restock Inventory (High Risk Only)
<10	Low	    Monitor

## Discoveries and Recommendations
(This section should be filled after you run the script and inspect outputs/analysis_report.json)

Example Discovery:

Discovered 5 products currently in the High Priority tier due to imminent stock-out risk coupled with strong market opportunity.

Example Recommendations (from Output):

Product ID 12345: Priority: High, Recommendation: URGENT REVIEW: Stock & Price

Product ID 67890: Priority: Low, Recommendation: Monitor

## Assumptions and Disclosure

### Assumptions
Primary Key: 
It is assumed that the fields holding the unique product identifier across all five files represent the same real-world entity and have been uniformly mapped to the key product_id during the loading phase.

Numerical Data: 
It is assumed that fields like price, current_stock, and sales_velocity are intended to be numeric; parsing includes robust handling of missing or null values by substituting a safe 0 to prevent script crashes.

Contextual Data: 
The competitor_intelligence.json is treated as market-wide context, applying its signals (e.g., price_erosion_rate) equally to all products during analysis.

## AI disclosure
### AI tools (Gemini, ChatGPT) were utilized solely for rapid prototyping, syntax confirmation, and developing analytical framework ideas. No large, complex functional blocks (like the core integration loop) were taken directly. Specifically, AI assistance was used for:

Node.js Syntax: Confirming the best asynchronous pattern for fs.createReadStream with the csv-parser library.

Analytical Framework: Brainstorming and structuring the initial Priority Framework logic for combining risk and opportunity factors.

Documentation: Refining and structuring the README.md content and section headings.

The final code implementation, data integration logic, key standardization, and debugging (handling the TypeError: analyzeData is not a function and nested property access) were performed manually.

### Prompts:

"I have a JSON file where product IDs are 64-bit integers. What npm library should I use to parse the file in Node.js without losing numerical precision, and how do I implement it?"

"I need to prioritize e-commerce inventory. Give me three quantitative factors to combine for a product priority framework, based on a mix of risk and opportunity."

"Draft a summary for the 'Analytical Approach' section of my README. The approach involves concurrency, key standardization across five files, and merging data using a JavaScript Map."

"My analytical script relies on hardcoded thresholds (e.g., stock < 20). Suggest a mechanism for making these thresholds dynamic using a separate configuration file in Node.js."

"I need to write the 'Future Enhancements' section of my README. My project is a Node.js data pipeline. Give me three specific, technical ideas for improving its scalability and performance."

"Create a professional README structure for a data pipeline project submission. It must include sections for Analytical Approach, Priority Framework, and Future Enhancements."

## Future Enhancements
Database Integration: 
Migrate the Master Catalog from an in-memory JavaScript Map to a persistent database (MongoDB or PostgreSQL) to handle larger datasets and provide API query support.

Dynamic Thresholds: 
Instead of hardcoding risk thresholds (e.g., stock < 20), calculate them dynamically based on the standard deviation of recent historical sales velocity.

Reporting: 
Integrate a library to export the final report directly to a highly readable format like Excel or a rich HTML dashboard.