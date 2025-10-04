#!/usr/bin/env node

import { Command } from 'commander';
import { EnhancedEcommerceScraper } from './EnhancedEcommerceScraper.js';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('enhanced-ecommerce-scraper')
  .description('Enhanced AI agent for natural language e-commerce product search and extraction')
  .version('2.0.0');

program
  .command('search')
  .description('Search for products using natural language prompts')
  .requiredOption('-p, --prompt <prompt>', 'Natural language prompt (e.g., "I want a green hoodie and blue jeans")')
  .option('-s, --site <site>', 'E-commerce site (asos, amazon)', 'asos')
  .option('-n, --pages <pages>', 'Number of pages to scrape', '1')
  .option('-f, --format <format>', 'Output format (json, csv, sqlite)', 'json')
  .option('-o, --output <filename>', 'Output filename (without extension)')
  .option('--download-images', 'Download product images to local storage')
  .option('--max-images <number>', 'Maximum number of images to download', '10')
  .option('--show-summary', 'Display product summary after search')
  .action(async (options) => {
    const scraper = new EnhancedEcommerceScraper({
      headless: true
    });

    try {
      console.log(chalk.blue('🚀 Starting enhanced e-commerce product search...'));
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
      console.log(chalk.green('✅ Enhanced search completed successfully!'));
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
  .command('demo')
  .description('Run demo with sample natural language prompts')
  .action(async () => {
    const scraper = new EnhancedEcommerceScraper({ headless: true });
    
    const demoPrompts = [
      "I want a green hoodie and blue jeans",
      "Show me black sneakers and white t-shirts",
      "I need a red dress and black heels",
      "Find me a navy jacket and khaki pants"
    ];

    try {
      console.log(chalk.blue('🎬 Enhanced E-commerce Scraper Demo'));
      console.log(chalk.gray('This demo shows natural language prompt parsing and enhanced product extraction'));
      console.log('');

      await scraper.initialize();

      for (const prompt of demoPrompts.slice(0, 2)) { // Run first 2 demos
        console.log(chalk.cyan(`🎯 Demo: "${prompt}"`));
        console.log('');
        
        const products = await scraper.searchFromPrompt(prompt, 'asos', 1);
        
        if (products.length > 0) {
          scraper.displayProductSummary(products);
          
          const savedPath = await scraper.saveEnhancedProducts(products, 'json', `demo_${Date.now()}`);
          console.log(chalk.green(`✓ Demo results saved to: ${savedPath}`));
        }
        
        console.log(chalk.gray('─'.repeat(50)));
        console.log('');
      }

    } catch (error) {
      console.error(chalk.red('❌ Demo error:'), error.message);
    } finally {
      await scraper.close();
    }
  });

program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode with natural language prompts')
  .action(async () => {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    try {
      console.log(chalk.blue('🎮 Interactive Enhanced E-commerce Scraper'));
      console.log(chalk.gray('Type natural language prompts like "I want a green hoodie and blue jeans"'));
      console.log(chalk.gray('Type "exit" to quit'));
      console.log('');

      const scraper = new EnhancedEcommerceScraper({ headless: true });
      await scraper.initialize();

      while (true) {
        const prompt = await question(chalk.cyan('Enter your request: '));
        
        if (prompt.toLowerCase() === 'exit') {
          break;
        }

        if (!prompt.trim()) {
          console.log(chalk.yellow('Please enter a valid request'));
          continue;
        }

        const site = await question(chalk.cyan('Enter site (asos/amazon) [asos]: ')) || 'asos';
        const pages = await question(chalk.cyan('Enter number of pages [1]: ')) || '1';
        const format = await question(chalk.cyan('Enter output format (json/csv/sqlite) [json]: ')) || 'json';
        const showSummary = await question(chalk.cyan('Show product summary? (y/n) [y]: ')) || 'y';

        try {
          console.log('');
          const products = await scraper.searchFromPrompt(prompt, site, parseInt(pages));
          
          if (products.length > 0) {
            if (showSummary.toLowerCase() === 'y') {
              scraper.displayProductSummary(products);
            }
            
            const savedPath = await scraper.saveEnhancedProducts(products, format);
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
