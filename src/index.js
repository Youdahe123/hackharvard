#!/usr/bin/env node

import { Command } from 'commander';
import { EcommerceScraper } from './EcommerceScraper.js';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('ecommerce-scraper')
  .description('AI agent for automated e-commerce product search and extraction')
  .version('1.0.0');

program
  .command('search')
  .description('Search for products on e-commerce sites')
  .requiredOption('-q, --query <query>', 'Search query (e.g., "men puffer jacket")')
  .option('-s, --site <site>', 'E-commerce site (asos, amazon)', 'asos')
  .option('-p, --pages <pages>', 'Number of pages to scrape', '1')
  .option('-f, --format <format>', 'Output format (json, csv, sqlite)', 'json')
  .option('-o, --output <filename>', 'Output filename (without extension)')
  .option('--headless', 'Run in headless mode (default: true)', true)
  .option('--visible', 'Run with visible browser window')
  .option('--download-images', 'Download product images to local storage')
  .option('--max-images <number>', 'Maximum number of images to download', '10')
  .action(async (options) => {
    const scraper = new EcommerceScraper({
      headless: options.visible ? false : true
    });

    try {
      console.log(chalk.blue('🚀 Starting e-commerce product search...'));
      console.log(chalk.gray(`Query: "${options.query}"`));
      console.log(chalk.gray(`Site: ${options.site}`));
      console.log(chalk.gray(`Pages: ${options.pages}`));
      console.log(chalk.gray(`Format: ${options.format}`));
      console.log('');

      await scraper.initialize();
      
      const products = await scraper.searchProducts(
        options.query,
        options.site,
        parseInt(options.pages)
      );

      if (products.length === 0) {
        console.log(chalk.yellow('⚠ No products found'));
        return;
      }

      const savedPath = await scraper.saveProducts(
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
      console.log(chalk.green('✅ Search completed successfully!'));
      console.log(chalk.green(`📁 Results saved to: ${savedPath}`));
      console.log(chalk.green(`📊 Total products found: ${products.length}`));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    } finally {
      await scraper.close();
    }
  });

program
  .command('list')
  .description('List saved product files')
  .option('-f, --format <format>', 'Filter by format (json, csv, sqlite)')
  .action(async (options) => {
    const { DataStorage } = await import('./DataStorage.js');
    const storage = new DataStorage();
    
    try {
      const files = await storage.listFiles(options.format);
      
      if (files.length === 0) {
        console.log(chalk.yellow('No saved files found'));
        return;
      }

      console.log(chalk.blue('📁 Saved product files:'));
      console.log('');
      
      for (const file of files) {
        const stats = await storage.getFileStats(file.replace(/\.[^/.]+$/, ''), file.split('.').pop());
        const size = stats ? (stats.size / 1024).toFixed(2) + ' KB' : 'Unknown';
        console.log(chalk.gray(`  ${file} (${size})`));
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }
  });

program
  .command('load')
  .description('Load and display saved products')
  .requiredOption('-f, --file <filename>', 'Filename (without extension)')
  .option('-t, --format <format>', 'File format (json, csv, sqlite)', 'json')
  .option('-l, --limit <limit>', 'Limit number of products to display', '10')
  .action(async (options) => {
    const { DataStorage } = await import('./DataStorage.js');
    const storage = new DataStorage();
    
    try {
      const data = await storage.load(options.file, options.format);
      const products = data.products || data;
      const limit = parseInt(options.limit);
      const displayProducts = products.slice(0, limit);
      
      console.log(chalk.blue(`📦 Loading products from ${options.file}.${options.format}`));
      console.log('');
      
      if (data.timestamp) {
        console.log(chalk.gray(`Timestamp: ${data.timestamp}`));
        console.log(chalk.gray(`Total products: ${data.total_products}`));
        console.log('');
      }
      
      displayProducts.forEach((product, index) => {
        console.log(chalk.cyan(`${index + 1}. ${product.title}`));
        console.log(chalk.gray(`   URL: ${product.product_href}`));
        if (product.price) {
          console.log(chalk.gray(`   Price: ${product.price}`));
        }
        if (product.rating) {
          console.log(chalk.gray(`   Rating: ${product.rating}`));
        }
        console.log('');
      });
      
      if (products.length > limit) {
        console.log(chalk.yellow(`... and ${products.length - limit} more products`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
    }
  });

program
  .command('demo')
  .description('Run a demo search with sample data')
  .action(async () => {
    const scraper = new EcommerceScraper({ headless: true });
    
    try {
      console.log(chalk.blue('🎯 Running demo search...'));
      
      await scraper.initialize();
      
      // Demo search on ASOS
      const products = await scraper.searchProducts('men puffer jacket', 'asos', 1);
      
      if (products.length > 0) {
        await scraper.saveProducts(products, 'json', 'demo_results');
        console.log(chalk.green('✅ Demo completed! Check data/demo_results.json'));
      } else {
        console.log(chalk.yellow('⚠ No products found in demo'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Demo error:'), error.message);
    } finally {
      await scraper.close();
    }
  });

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(async () => {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    try {
      console.log(chalk.blue('🎮 Interactive E-commerce Scraper'));
      console.log(chalk.gray('Type "exit" to quit'));
      console.log('');

      const scraper = new EcommerceScraper({ headless: true });
      await scraper.initialize();

      while (true) {
        const query = await question(chalk.cyan('Enter search query: '));
        
        if (query.toLowerCase() === 'exit') {
          break;
        }

        if (!query.trim()) {
          console.log(chalk.yellow('Please enter a valid search query'));
          continue;
        }

        const site = await question(chalk.cyan('Enter site (asos/amazon) [asos]: ')) || 'asos';
        const pages = await question(chalk.cyan('Enter number of pages [1]: ')) || '1';
        const format = await question(chalk.cyan('Enter output format (json/csv/sqlite) [json]: ')) || 'json';

        try {
          console.log('');
          const products = await scraper.searchProducts(query, site, parseInt(pages));
          
          if (products.length > 0) {
            const savedPath = await scraper.saveProducts(products, format);
            console.log(chalk.green(`✅ Saved ${products.length} products to ${savedPath}`));
          } else {
            console.log(chalk.yellow('⚠ No products found'));
          }
        } catch (error) {
          console.error(chalk.red('❌ Error:'), error.message);
        }
        
        console.log('');
      }

      rl.close();
      await scraper.close();
      console.log(chalk.blue('👋 Goodbye!'));
      
    } catch (error) {
      console.error(chalk.red('❌ Interactive mode error:'), error.message);
      rl.close();
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

