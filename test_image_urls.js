#!/usr/bin/env node

import { RealEcommerceScraper } from './src/RealEcommerceScraper.js';
import chalk from 'chalk';

async function testImageUrlExtraction() {
  console.log(chalk.blue('🖼️  Testing Image URL Extraction from Product Photos'));
  console.log(chalk.gray('This test extracts URLs from product images and thumbnails'));
  console.log('');

  const scraper = new RealEcommerceScraper({ 
    headless: true, // Run in background
    timeout: 60000 
  });

  try {
    console.log(chalk.cyan('1. Initializing browser...'));
    await scraper.initialize();
    
    console.log(chalk.cyan('2. Searching for "nike green shorts" on Amazon...'));
    const products = await scraper.searchProducts('nike green shorts', 'amazon', 1);
    
    if (products.length > 0) {
      console.log(chalk.green(`✅ Found ${products.length} products!`));
      
      // Show first few products with their image URLs
      console.log(chalk.cyan('📸 Product Image URLs:'));
      products.slice(0, 3).forEach((product, index) => {
        console.log(chalk.white(`\n${index + 1}. ${product.title}`));
        console.log(chalk.gray(`   Product URL: ${product.product_href}`));
        console.log(chalk.gray(`   Thumbnail URL: ${product.thumbnail}`));
        console.log(chalk.gray(`   Full Resolution Image: ${product.full_resolution_image}`));
        if (product.image_click_url) {
          console.log(chalk.gray(`   Image Click URL: ${product.image_click_url}`));
        }
        console.log(chalk.gray(`   Price: ${product.price}`));
      });
      
      // Save the results with image URLs
      await scraper.saveEnhancedProducts(products, 'json', 'image_url_test');
      console.log(chalk.green('\n✅ Results with image URLs saved to data/image_url_test.json'));
      
      // Show how to download images from URLs
      console.log(chalk.cyan('\n🔄 How to download images from URLs:'));
      console.log(chalk.gray('You can now use these URLs to:'));
      console.log(chalk.gray('1. Download the images directly'));
      console.log(chalk.gray('2. Display them in your application'));
      console.log(chalk.gray('3. Process them for analysis'));
      console.log(chalk.gray('4. Store them in your database'));
      
      // Example of how to use the URLs
      if (products[0]) {
        console.log(chalk.cyan('\n💡 Example Usage:'));
        console.log(chalk.gray('```javascript'));
        console.log(chalk.white('// Get image URLs from scraped products'));
        console.log(chalk.white('const imageUrl = product.full_resolution_image;'));
        console.log(chalk.white('const thumbnailUrl = product.thumbnail;'));
        console.log(chalk.white(''));
        console.log(chalk.white('// Download the image'));
        console.log(chalk.white('const response = await fetch(imageUrl);'));
        console.log(chalk.white('const imageBuffer = await response.arrayBuffer();'));
        console.log(chalk.gray('```'));
      }
      
    } else {
      console.log(chalk.yellow('⚠ No products found'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
  } finally {
    await scraper.close();
  }
}

testImageUrlExtraction();
