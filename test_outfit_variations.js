#!/usr/bin/env node

import { RealEcommerceScraper } from './src/RealEcommerceScraper.js';
import chalk from 'chalk';

async function testOutfitVariations() {
  console.log(chalk.blue('👔 Testing Outfit Variations - 1 Item Per Category'));
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
    
    console.log(chalk.cyan('2. Searching for outfit items (1 variation each)...'));
    const products = await scraper.searchFromPrompt(
      "I want a red polo shirt with black dress pants white nike socks and jordan 4 thunders", 
      'amazon', 
      1
    );
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    if (products.length > 0) {
      console.log(chalk.green(`✅ Found ${products.length} outfit items in ${totalTime.toFixed(1)} seconds!`));
      
      // Group products by search query
      const outfitItems = {};
      products.forEach(product => {
        const query = product.searchQuery || 'unknown';
        if (!outfitItems[query]) {
          outfitItems[query] = product;
        }
      });
      
      // Display clean outfit results
      console.log(chalk.cyan('\n👔 Complete Outfit:'));
      Object.entries(outfitItems).forEach(([query, product], index) => {
        console.log(chalk.white(`\n${index + 1}. ${product.name}`));
        console.log(chalk.gray(`   💰 Price: $${product.price}`));
        console.log(chalk.gray(`   🔗 Product URL: ${product.product_url}`));
        console.log(chalk.gray(`   📸 Photo URL: ${product.thumbnail_url}`));
        console.log(chalk.gray(`   🖼️  Full Resolution: ${product.full_resolution_image}`));
        if (product.image_click_url) {
          console.log(chalk.gray(`   🖱️  Clickable Image: ${product.image_click_url}`));
        }
      });
      
      // Show summary
      console.log(chalk.cyan('\n📊 Outfit Summary:'));
      console.log(chalk.gray(`Total Items: ${Object.keys(outfitItems).length}`));
      console.log(chalk.gray(`Processing Time: ${totalTime.toFixed(1)} seconds`));
      
      // Calculate total outfit cost
      const totalCost = Object.values(outfitItems).reduce((sum, product) => {
        const price = parseFloat(product.price) || 0;
        return sum + price;
      }, 0);
      
      if (totalCost > 0) {
        console.log(chalk.gray(`Total Outfit Cost: $${totalCost.toFixed(2)}`));
      }
      
      // Save clean results
      await scraper.saveEnhancedProducts(products, 'json', 'outfit_variations');
      console.log(chalk.green('\n✅ Outfit saved to data/outfit_variations.json'));
      
      // Show how to use the photo URLs
      console.log(chalk.cyan('\n💡 How to Use Photo URLs:'));
      console.log(chalk.gray('```javascript'));
      console.log(chalk.white('// Get photo URL for each outfit item'));
      console.log(chalk.white('const photoUrl = product.thumbnail_url;'));
      console.log(chalk.white('const fullResUrl = product.full_resolution_image;'));
      console.log(chalk.white(''));
      console.log(chalk.white('// Display in your app'));
      console.log(chalk.white('<img src={photoUrl} alt={product.name} />'));
      console.log(chalk.gray('```'));
      
    } else {
      console.log(chalk.yellow('⚠ No outfit items found'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error.message);
  } finally {
    await scraper.close();
  }
}

testOutfitVariations();
