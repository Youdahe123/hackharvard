#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import { EnhancedEcommerceScraper } from './src/EnhancedEcommerceScraper.js';
import { PromptParser } from './src/PromptParser.js';

// Mock enhanced scraper for demonstration
class MockEnhancedScraper extends EnhancedEcommerceScraper {
  async initialize() {
    const spinner = ora('Launching browser...').start();
    await new Promise(resolve => setTimeout(resolve, 1000));
    spinner.succeed('Browser launched successfully');
    return true;
  }

  async searchProducts(query, site, maxPages) {
    const spinner = ora(`Searching for "${query}" on ${site.toUpperCase()}...`).start();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate mock products based on query
    const products = this.generateMockProducts(query, site, maxPages);
    
    spinner.succeed(`Found ${products.length} products`);
    console.log(chalk.green(`✓ Successfully extracted ${products.length} products from ${site.toUpperCase()}`));
    
    return products;
  }

  generateMockProducts(query, site, pages) {
    const products = [];
    const productsPerPage = 8;
    const totalProducts = productsPerPage * pages;

    // Parse the query to generate relevant products
    const parser = new PromptParser();
    const requests = parser.parsePrompt(query);

    for (let i = 1; i <= totalProducts; i++) {
      const request = requests[i % requests.length] || requests[0];
      const productId = Math.floor(Math.random() * 1000000);
      
      const product = {
        product_href: site === 'amazon' 
          ? `https://www.amazon.com/dp/B${productId.toString().padStart(10, '0')}`
          : `https://www.asos.com/us/product/${productId}`,
        title: this.generateProductTitle(request, i),
        thumbnail: this.generateImageUrl(request),
        price: this.generatePrice(),
        rating: this.generateRating()
      };

      products.push(product);
    }

    return products;
  }

  generateProductTitle(request, index) {
    const brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Levi\'s', 'Gap', 'Tommy Hilfiger'];
    const brand = request.brand || brands[Math.floor(Math.random() * brands.length)];
    const category = request.category || 'clothing';
    const color = request.color || 'black';
    const size = request.size || 'M';

    return `${brand} ${color.charAt(0).toUpperCase() + color.slice(1)} ${category.charAt(0).toUpperCase() + category.slice(1)} - Size ${size.toUpperCase()} (Style ${index})`;
  }

  generateImageUrl(request) {
    const baseUrls = [
      'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SX679_.jpg',
      'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SX679_.jpg',
      'https://images.asos-media.com/products/example-product.jpg'
    ];
    return baseUrls[Math.floor(Math.random() * baseUrls.length)];
  }

  generatePrice() {
    const prices = ['$29.99', '$49.99', '$79.99', '$129.99', '$199.99', '$299.99'];
    return prices[Math.floor(Math.random() * prices.length)];
  }

  generateRating() {
    const ratings = ['4.2 out of 5 stars', '4.5 out of 5 stars', '4.7 out of 5 stars', '4.8 out of 5 stars'];
    return ratings[Math.floor(Math.random() * ratings.length)];
  }

  async close() {
    console.log(chalk.blue('🔒 Browser closed'));
  }
}

async function runEnhancedDemo() {
  console.log(chalk.blue('🎯 Enhanced E-commerce Scraper with Natural Language Processing'));
  console.log(chalk.gray('This demo shows how to parse natural language prompts and extract structured product data'));
  console.log('');

  // Demo 1: Show prompt parsing
  console.log(chalk.cyan('🧠 Demo 1: Natural Language Prompt Parsing'));
  console.log('');

  const promptParser = new PromptParser();
  const demoPrompts = [
    "I want a green hoodie and blue jeans",
    "Show me black sneakers and white t-shirts",
    "I need a red dress and black heels",
    "Find me a navy jacket and khaki pants"
  ];

  demoPrompts.forEach((prompt, index) => {
    console.log(chalk.white(`${index + 1}. "${prompt}"`));
    const requests = promptParser.parsePrompt(prompt);
    
    requests.forEach((request, reqIndex) => {
      console.log(chalk.gray(`   Request ${reqIndex + 1}:`));
      if (request.color) console.log(chalk.gray(`     Color: ${request.color}`));
      if (request.category) console.log(chalk.gray(`     Category: ${request.category}`));
      if (request.brand) console.log(chalk.gray(`     Brand: ${request.brand}`));
      if (request.size) console.log(chalk.gray(`     Size: ${request.size}`));
      console.log(chalk.gray(`     Search Query: "${promptParser.generateSearchQuery(request)}"`));
    });
    console.log('');
  });

  // Demo 2: Enhanced product search
  console.log(chalk.cyan('🔍 Demo 2: Enhanced Product Search and Extraction'));
  console.log('');

  const scraper = new MockEnhancedScraper();
  
  try {
    await scraper.initialize();
    
    const testPrompt = "I want a green hoodie and blue jeans";
    console.log(chalk.yellow(`Testing prompt: "${testPrompt}"`));
    console.log('');
    
    const products = await scraper.searchFromPrompt(testPrompt, 'asos', 1);
    
    if (products.length > 0) {
      // Show enhanced product data structure
      console.log(chalk.cyan('📋 Enhanced Product Data Structure:'));
      products.slice(0, 2).forEach((product, index) => {
        console.log(chalk.white(`${index + 1}. ${product.name}`));
        console.log(chalk.gray(`   Category: ${product.category}`));
        console.log(chalk.gray(`   Brand: ${product.brand}`));
        console.log(chalk.gray(`   Price: $${product.price}`));
        console.log(chalk.gray(`   Size: ${product.size || 'N/A'}`));
        console.log(chalk.gray(`   Color: ${product.color || 'N/A'}`));
        console.log(chalk.gray(`   Thumbnail URL: ${product.thumbnail_url}`));
        console.log(chalk.gray(`   Product URL: ${product.product_url}`));
        console.log(chalk.gray(`   Created: ${product.createdAt}`));
        console.log('');
      });

      // Show product summary
      scraper.displayProductSummary(products);

      // Save enhanced products
      const savedPath = await scraper.saveEnhancedProducts(products, 'json', 'enhanced_demo');
      console.log(chalk.green(`✅ Enhanced products saved to: ${savedPath}`));
    }

  } catch (error) {
    console.error(chalk.red('❌ Demo error:'), error.message);
  } finally {
    await scraper.close();
  }

  console.log('');
  console.log(chalk.cyan('🛠️  Enhanced Features:'));
  console.log(chalk.green('✅ Natural language prompt parsing'));
  console.log(chalk.green('✅ Automatic category detection'));
  console.log(chalk.green('✅ Brand extraction from product titles'));
  console.log(chalk.green('✅ Color identification'));
  console.log(chalk.green('✅ Size extraction'));
  console.log(chalk.green('✅ Price parsing and normalization'));
  console.log(chalk.green('✅ Structured data output with timestamps'));
  console.log(chalk.green('✅ Product filtering and categorization'));
  console.log(chalk.green('✅ Comprehensive product summaries'));
  console.log('');

  console.log(chalk.cyan('💻 CLI Usage Examples:'));
  console.log(chalk.gray('# Natural language search'));
  console.log(chalk.white('node src/enhanced_cli.js search -p "I want a green hoodie and blue jeans"'));
  console.log('');
  console.log(chalk.gray('# Search with summary and image download'));
  console.log(chalk.white('node src/enhanced_cli.js search -p "black sneakers" -s amazon --show-summary --download-images'));
  console.log('');
  console.log(chalk.gray('# Interactive mode'));
  console.log(chalk.white('node src/enhanced_cli.js interactive'));
  console.log('');

  console.log(chalk.cyan('🔧 Programmatic Usage:'));
  console.log(chalk.gray('```javascript'));
  console.log(chalk.white('import { EnhancedEcommerceScraper } from "./src/EnhancedEcommerceScraper.js";'));
  console.log(chalk.white(''));
  console.log(chalk.white('const scraper = new EnhancedEcommerceScraper();'));
  console.log(chalk.white('await scraper.initialize();'));
  console.log(chalk.white('const products = await scraper.searchFromPrompt('));
  console.log(chalk.white('  "I want a green hoodie and blue jeans", "asos", 1'));
  console.log(chalk.white(');'));
  console.log(chalk.white('await scraper.saveEnhancedProducts(products, "json", "results");'));
  console.log(chalk.gray('```'));
  console.log('');

  console.log(chalk.blue('🎉 Enhanced Demo Completed!'));
  console.log(chalk.yellow('💡 The enhanced agent can now:'));
  console.log(chalk.gray('  ✓ Parse natural language prompts like "I want a green hoodie and blue jeans"'));
  console.log(chalk.gray('  ✓ Extract structured product data (name, category, brand, price, size, color)'));
  console.log(chalk.gray('  ✓ Generate comprehensive product summaries'));
  console.log(chalk.gray('  ✓ Filter and categorize products automatically'));
  console.log(chalk.gray('  ✓ Save enhanced data with timestamps'));
  console.log(chalk.gray('  ✓ Handle multiple product requests in a single prompt'));
  console.log('');
  console.log(chalk.green('🚀 Natural language e-commerce scraping is now fully functional!'));
}

// Run the enhanced demo
runEnhancedDemo().catch(error => {
  console.error(chalk.red('Enhanced demo failed:'), error);
  process.exit(1);
});
