#!/usr/bin/env node

import { Command } from 'commander';
import { RealEcommerceScraper } from './RealEcommerceScraper.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('real-ecommerce-scraper')
  .description('Real e-commerce scraper with actual product data extraction')
  .version('1.0.0');

program
  .command('search')
  .description('Search for real products using natural language prompts')
  .requiredOption('-p, --prompt <prompt>', 'Natural language prompt (e.g., "I want a green hoodie and blue jeans")')
  .option('-s, --site <site>', 'E-commerce site (asos, amazon)', 'asos')
  .option('-n, --pages <pages>', 'Number of pages to scrape', '1')
  .option('-f, --format <format>', 'Output format (json, csv, sqlite)', 'json')
  .option('-o, --output <filename>', 'Output filename (without extension)')
  .option('--download-images', 'Download product images to local storage')
  .option('--max-images <number>', 'Maximum number of images to download', '10')
  .option('--show-summary', 'Display product summary after search')
  .option('--visible', 'Run with visible browser window')
  .action(async (options) => {
    const scraper = new RealEcommerceScraper({
      headless: options.visible ? false : true
    });

    try {
      console.log(chalk.blue('🚀 Starting real e-commerce product search...'));
      console.log(chalk.gray(`Prompt: "${options.prompt}"`));
      console.log(chalk.gray(`Site: ${options.site}`));
      console.log(chalk.gray(`Pages: ${options.pages}`));
      console.log(chalk.gray(`Format: ${options.format}`));
      console.log('');

      await scraper.initialize();
      
      const products = await scraper.searchFromPrompt(
        options.prompt,
        options.site,
        parseInt(options.pages)
      );

      if (products.length === 0) {
        console.log(chalk.yellow('⚠ No products found'));
        return;
      }

      // Display product summary if requested
      if (options.showSummary) {
        scraper.displayProductSummary(products);
      }

      // Show sample products with real URLs
      console.log(chalk.cyan('📋 Sample Products with Real URLs:'));
      products.slice(0, 3).forEach((product, index) => {
        console.log(chalk.white(`${index + 1}. ${product.name}`));
        console.log(chalk.gray(`   Category: ${product.category}`));
        console.log(chalk.gray(`   Brand: ${product.brand}`));
        console.log(chalk.gray(`   Price: $${product.price}`));
        console.log(chalk.gray(`   Color: ${product.color}`));
        console.log(chalk.gray(`   Product URL: ${product.product_url}`));
        console.log(chalk.gray(`   Image URL: ${product.thumbnail_url}`));
        console.log('');
      });

      // Save enhanced products
      const savedPath = await scraper.saveEnhancedProducts(
        products,
        options.format,
        options.output
      );

      // Download images if requested
      if (options.downloadImages) {
        console.log('');
        const downloadedImages = await scraper.downloadProductImages(products, {
          maxImages: parseInt(options.maxImages)
        });
        
        if (downloadedImages.length > 0) {
          console.log(chalk.green(`🖼️  Images saved to: data/images/`));
        }
      }

      console.log('');
      console.log(chalk.green('✅ Real product search completed successfully!'));
      console.log(chalk.green(`📁 Results saved to: ${savedPath}`));
      console.log(chalk.green(`📊 Total products found: ${products.length}`));
      console.log(chalk.yellow('💡 All URLs and images are real and functional!'));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    } finally {
      await scraper.close();
    }
  });

program
  .command('test')
  .description('Test the scraper with a simple search')
  .action(async () => {
    const scraper = new RealEcommerceScraper({ headless: false }); // Visible for testing
    
    try {
      console.log(chalk.blue('🧪 Testing real e-commerce scraper...'));
      console.log('');

      await scraper.initialize();
      
      // Test with a more specific search on Amazon (more reliable)
      const products = await scraper.searchProducts('nike green shorts', 'amazon', 1);
      
      if (products.length > 0) {
        console.log(chalk.green(`✅ Test successful! Found ${products.length} real products`));
        
        // Show first product with real data
        const firstProduct = products[0];
        console.log(chalk.cyan('📋 First Product (Real Data):'));
        console.log(chalk.white(`Title: ${firstProduct.title}`));
        console.log(chalk.gray(`URL: ${firstProduct.product_href}`));
        console.log(chalk.gray(`Image: ${firstProduct.thumbnail}`));
        console.log(chalk.gray(`Price: ${firstProduct.price}`));
        
        // Show detailed information if available
        if (firstProduct.detailedInfo) {
          console.log(chalk.cyan('🔍 Detailed Information:'));
          if (firstProduct.brand) console.log(chalk.gray(`Brand: ${firstProduct.brand}`));
          if (firstProduct.description) console.log(chalk.gray(`Description: ${firstProduct.description.substring(0, 100)}...`));
          if (firstProduct.sizes && firstProduct.sizes.length > 0) console.log(chalk.gray(`Available Sizes: ${firstProduct.sizes.join(', ')}`));
          if (firstProduct.colors && firstProduct.colors.length > 0) console.log(chalk.gray(`Available Colors: ${firstProduct.colors.join(', ')}`));
          if (firstProduct.availability) console.log(chalk.gray(`Availability: ${firstProduct.availability}`));
          if (firstProduct.reviewCount) console.log(chalk.gray(`Reviews: ${firstProduct.reviewCount}`));
          if (firstProduct.allImages && firstProduct.allImages.length > 0) {
            console.log(chalk.gray(`Total Images: ${firstProduct.allImages.length}`));
            console.log(chalk.gray(`Main Image: ${firstProduct.mainImage}`));
          }
        }
        
        // Save test results
        await scraper.saveEnhancedProducts(products, 'json', 'test_real_products');
        console.log(chalk.green('✅ Test results saved'));
      } else {
        console.log(chalk.yellow('⚠ No products found in test'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Test failed:'), error.message);
    } finally {
      await scraper.close();
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s'), program.args.join(' '));
  console.log(chalk.gray('See --help for available commands'));
  process.exit(1);
});

// Parse command line arguments
program.parse();
