#!/usr/bin/env node

import chalk from 'chalk';
import { DataStorage } from './src/DataStorage.js';

console.log(chalk.blue('🎯 E-commerce Scraper Agent Demo'));
console.log('');

// Demo 1: Show the project structure
console.log(chalk.cyan('📁 Project Structure:'));
console.log(chalk.gray('ecommerce-scraper-agent/'));
console.log(chalk.gray('├── src/'));
console.log(chalk.gray('│   ├── EcommerceScraper.js    # Main scraper class'));
console.log(chalk.gray('│   ├── DataStorage.js         # Data persistence'));
console.log(chalk.gray('│   ├── ErrorHandler.js        # Error handling'));
console.log(chalk.gray('│   ├── index.js              # CLI interface'));
console.log(chalk.gray('│   └── test.js               # Test suite'));
console.log(chalk.gray('├── scrapers/'));
console.log(chalk.gray('│   ├── ASOSScraper.js        # ASOS-specific logic'));
console.log(chalk.gray('│   └── AmazonScraper.js      # Amazon-specific logic'));
console.log(chalk.gray('├── data/                     # Output directory'));
console.log(chalk.gray('└── package.json'));
console.log('');

// Demo 2: Show sample product data structure
console.log(chalk.cyan('📦 Sample Product Data Structure:'));
const sampleProducts = [
  {
    product_href: "https://www.amazon.com/dp/B08N5WRWNW",
    title: "Sony WH-1000XM4 Wireless Premium Noise Canceling Overhead Headphones",
    thumbnail: "https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SX679_.jpg",
    price: "$278.00",
    rating: "4.6 out of 5 stars"
  },
  {
    product_href: "https://www.asos.com/us/product/12345",
    title: "Men's Puffer Jacket",
    thumbnail: "https://images.asos-media.com/products/...",
    price: "$89.99",
    rating: "4.5 out of 5 stars"
  }
];

console.log(JSON.stringify(sampleProducts, null, 2));
console.log('');

// Demo 3: Test data storage functionality
console.log(chalk.cyan('💾 Testing Data Storage:'));
const storage = new DataStorage();

try {
  // Test JSON storage
  const jsonPath = await storage.save(sampleProducts, 'json', 'demo_products');
  console.log(chalk.green(`✅ JSON saved to: ${jsonPath}`));
  
  // Test CSV storage
  const csvPath = await storage.save(sampleProducts, 'csv', 'demo_products');
  console.log(chalk.green(`✅ CSV saved to: ${csvPath}`));
  
  // Test SQLite storage
  const dbPath = await storage.save(sampleProducts, 'sqlite', 'demo_products');
  console.log(chalk.green(`✅ SQLite saved to: ${dbPath}`));
  
} catch (error) {
  console.log(chalk.red('❌ Storage test failed:'), error.message);
}
console.log('');

// Demo 4: Show CLI usage examples
console.log(chalk.cyan('🖥️  CLI Usage Examples:'));
console.log(chalk.gray('# Basic search'));
console.log(chalk.white('node src/index.js search -q "men puffer jacket" -s asos'));
console.log('');
console.log(chalk.gray('# Advanced search with options'));
console.log(chalk.white('node src/index.js search -q "wireless headphones" -s amazon -p 3 -f csv -o results'));
console.log('');
console.log(chalk.gray('# Interactive mode'));
console.log(chalk.white('node src/index.js interactive'));
console.log('');
console.log(chalk.gray('# List saved files'));
console.log(chalk.white('node src/index.js list'));
console.log('');
console.log(chalk.gray('# Load and display products'));
console.log(chalk.white('node src/index.js load -f demo_products'));
console.log('');

// Demo 5: Show supported features
console.log(chalk.cyan('✨ Key Features:'));
console.log(chalk.green('✅ Automated product search using Puppeteer'));
console.log(chalk.green('✅ Multi-site support (ASOS, Amazon)'));
console.log(chalk.green('✅ Multiple output formats (JSON, CSV, SQLite)'));
console.log(chalk.green('✅ Command-line interface'));
console.log(chalk.green('✅ Interactive mode'));
console.log(chalk.green('✅ Error handling with retry logic'));
console.log(chalk.green('✅ Pagination support'));
console.log(chalk.green('✅ Bot detection handling'));
console.log('');

// Demo 6: Show programmatic usage
console.log(chalk.cyan('🔧 Programmatic Usage Example:'));
console.log(chalk.gray('```javascript'));
console.log(chalk.white('import { EcommerceScraper } from "./src/EcommerceScraper.js";'));
console.log(chalk.white(''));
console.log(chalk.white('const scraper = new EcommerceScraper({ headless: true });'));
console.log(chalk.white(''));
console.log(chalk.white('await scraper.initialize();'));
console.log(chalk.white('const products = await scraper.searchProducts("men jacket", "asos", 2);'));
console.log(chalk.white('await scraper.saveProducts(products, "json", "my_results");'));
console.log(chalk.white('await scraper.close();'));
console.log(chalk.gray('```'));
console.log('');

console.log(chalk.blue('🎉 Demo completed! The e-commerce scraper agent is ready to use.'));
console.log(chalk.yellow('💡 Note: Make sure to install dependencies with "npm install" before running.'));
console.log(chalk.yellow('💡 For actual scraping, ensure you have a stable internet connection.'));
