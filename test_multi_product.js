#!/usr/bin/env node

import { RealEcommerceScraper } from './src/RealEcommerceScraper.js';
import chalk from 'chalk';

async function testMultiProductPrompt() {
  console.log(chalk.blue('🧪 Testing Multi-Product Prompt'));
  console.log(chalk.gray('Prompt: "I want a red polo shirt with black dress pants white nike socks and jordan 4 thunders"'));
  console.log('');

  const startTime = Date.now();
  const scraper = new RealEcommerceScraper({ 
    headless: true,
    timeout: 60000 
  });

  try {
    console.log(chalk.cyan('1. Initializing browser...'));
    await scraper.initialize();
    
    console.log(chalk.cyan('2. Parsing and searching for multiple products...'));
    const products = await scraper.searchFromPrompt(
      "I want a red polo shirt with black dress pants white nike socks and jordan 4 thunders", 
      'amazon', 
      1
    );
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    if (products.length > 0) {
      console.log(chalk.green(`✅ Found ${products.length} products in ${totalTime.toFixed(1)} seconds!`));
      
      // Group products by search query
      const groupedProducts = {};
      products.forEach(product => {
        const query = product.searchQuery || 'unknown';
        if (!groupedProducts[query]) {
          groupedProducts[query] = [];
        }
        groupedProducts[query].push(product);
      });
      
      // Display results by category
      console.log(chalk.cyan('\n📋 Results by Product Category:'));
      Object.entries(groupedProducts).forEach(([query, categoryProducts], index) => {
        console.log(chalk.white(`\n${index + 1}. ${query.toUpperCase()}`));
        console.log(chalk.gray(`   Found ${categoryProducts.length} products`));
        
        // Show first 2 products from each category
        categoryProducts.slice(0, 2).forEach((product, pIndex) => {
          console.log(chalk.gray(`   ${pIndex + 1}. ${product.name}`));
          console.log(chalk.gray(`      Price: $${product.price}`));
          console.log(chalk.gray(`      URL: ${product.product_url}`));
          console.log(chalk.gray(`      Image: ${product.thumbnail_url}`));
        });
        
        if (categoryProducts.length > 2) {
          console.log(chalk.gray(`   ... and ${categoryProducts.length - 2} more products`));
        }
      });
      
      // Show summary
      console.log(chalk.cyan('\n📊 Summary:'));
      console.log(chalk.gray(`Total Products Found: ${products.length}`));
      console.log(chalk.gray(`Categories: ${Object.keys(groupedProducts).length}`));
      console.log(chalk.gray(`Processing Time: ${totalTime.toFixed(1)} seconds`));
      console.log(chalk.gray(`Average per product: ${(totalTime / products.length).toFixed(1)} seconds`));
      
      // Save results
      await scraper.saveEnhancedProducts(products, 'json', 'multi_product_test');
      console.log(chalk.green('\n✅ Results saved to data/multi_product_test.json'));
      
    } else {
      console.log(chalk.yellow('⚠ No products found'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
  } finally {
    await scraper.close();
  }
}

testMultiProductPrompt();
