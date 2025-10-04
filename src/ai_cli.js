#!/usr/bin/env node

import { AIEnhancedScraper } from './AIEnhancedScraper.js';
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('ai-scraper')
  .description('AI-Enhanced E-commerce Scraper with Intelligent Prompt Processing')
  .version('1.0.0');

program
  .command('outfit')
  .description('Process a natural language outfit request with AI optimization')
  .argument('<prompt>', 'Natural language description of what you want to buy')
  .option('-s, --site <site>', 'E-commerce site to search (amazon, asos)', 'amazon')
  .action(async (prompt, options) => {
    console.log(chalk.blue('🤖 AI-Enhanced E-commerce Scraper'));
    console.log(chalk.gray('Using OpenAI to optimize your search queries'));
    console.log('');

    const scraper = new AIEnhancedScraper();
    
    try {
      const result = await scraper.processOutfitRequest(prompt, options.site);
      
      if (result.success) {
        console.log(chalk.green('✅ Outfit request completed successfully!'));
        
        // Show essential data
        const essentialData = scraper.getEssentialData(result.products);
        console.log(chalk.cyan('\n📋 Essential Data:'));
        console.log(JSON.stringify(essentialData, null, 2));
        
      } else {
        console.log(chalk.red('❌ Outfit request failed:'), result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test the AI-enhanced scraper with a sample prompt')
  .action(async () => {
    const testPrompt = "I want a red polo shirt with black dress pants white nike socks and jordan 4 thunders";
    
    console.log(chalk.blue('🧪 Testing AI-Enhanced Scraper'));
    console.log(chalk.gray(`Test prompt: "${testPrompt}"`));
    console.log('');

    const scraper = new AIEnhancedScraper();
    
    try {
      const result = await scraper.processOutfitRequest(testPrompt, 'amazon');
      
      if (result.success) {
        console.log(chalk.green('✅ Test completed successfully!'));
        console.log(chalk.cyan(`Found ${result.products.length} items in ${result.totalTime.toFixed(1)} seconds`));
      } else {
        console.log(chalk.red('❌ Test failed:'), result.error);
      }
    } catch (error) {
      console.error(chalk.red('❌ Test error:'), error.message);
    }
  });

program.parse();
