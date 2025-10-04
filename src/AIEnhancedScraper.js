import { IntelligentPromptProcessor } from './IntelligentPromptProcessor.js';
import { DataStorage } from './DataStorage.js';
import chalk from 'chalk';
import ora from 'ora';

export class AIEnhancedScraper {
  constructor() {
    this.promptProcessor = new IntelligentPromptProcessor();
    this.dataStorage = new DataStorage();
  }

  async processOutfitRequest(userPrompt, site = 'amazon') {
    console.log(chalk.blue('🚀 AI-Enhanced E-commerce Scraper'));
    console.log(chalk.gray('Workflow: AI Prompt Processing → Optimized Search → Puppeteer Scraping'));
    console.log('');

    const startTime = Date.now();

    try {
      // Step 1: AI processes the prompt
      const searchQueries = await this.promptProcessor.processPrompt(userPrompt);
      
      if (!searchQueries || searchQueries.length === 0) {
        throw new Error('No search queries generated from prompt');
      }

      // Step 2: Execute optimized searches with Puppeteer
      const products = await this.promptProcessor.searchWithOptimizedQueries(searchQueries, site, 1);
      
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      if (products.length > 0) {
        // Step 3: Display results
        this.displayOutfitResults(products, totalTime);
        
        // Step 4: Save results
        const savedPath = await this.saveResults(products, userPrompt);
        
        return {
          success: true,
          products: products,
          totalTime: totalTime,
          savedPath: savedPath
        };
      } else {
        console.log(chalk.yellow('⚠ No products found'));
        return {
          success: false,
          products: [],
          totalTime: totalTime,
          error: 'No products found'
        };
      }

    } catch (error) {
      console.error(chalk.red('❌ AI-Enhanced scraping failed:'), error.message);
      return {
        success: false,
        products: [],
        totalTime: (Date.now() - startTime) / 1000,
        error: error.message
      };
    }
  }

  displayOutfitResults(products, totalTime) {
    console.log(chalk.cyan('👔 Complete Outfit Results:'));
    console.log('');

    products.forEach((product, index) => {
      console.log(chalk.white(`${index + 1}. ${product.title}`));
      console.log(chalk.gray(`   💰 Price: $${product.price}`));
      console.log(chalk.gray(`   🔗 Product URL: ${product.product_url}`));
      console.log(chalk.gray(`   📸 Photo URL: ${product.thumbnail_url}`));
      console.log(chalk.gray(`   🖼️  Full Resolution: ${product.full_resolution_image}`));
      console.log(chalk.gray(`   🏷️  Category: ${product.category}`));
      console.log(chalk.gray(`   🔍 Search Query: ${product.searchQuery}`));
      console.log('');
    });

    // Calculate total cost
    const totalCost = products.reduce((sum, product) => {
      const price = parseFloat(product.price) || 0;
      return sum + price;
    }, 0);

    console.log(chalk.cyan('📊 Outfit Summary:'));
    console.log(chalk.gray(`Total Items: ${products.length}`));
    console.log(chalk.gray(`Total Cost: $${totalCost.toFixed(2)}`));
    console.log(chalk.gray(`Processing Time: ${totalTime.toFixed(1)} seconds`));
    console.log('');
  }

  async saveResults(products, originalPrompt) {
    const spinner = ora('Saving outfit results...').start();
    
    try {
      const data = {
        timestamp: new Date().toISOString(),
        originalPrompt: originalPrompt,
        totalItems: products.length,
        totalCost: products.reduce((sum, product) => sum + (parseFloat(product.price) || 0), 0),
        items: products.map(product => ({
          name: product.title,
          category: product.category,
          price: product.price,
          product_url: product.product_url,
          thumbnail_url: product.thumbnail_url,
          full_resolution_image: product.full_resolution_image,
          searchQuery: product.searchQuery
        }))
      };

      const result = await this.dataStorage.save(data, 'json', 'ai_outfit_results');
      spinner.succeed('Outfit results saved');
      console.log(chalk.green(`✓ Saved to: ${result}`));
      return result;
    } catch (error) {
      spinner.fail('Failed to save results');
      throw error;
    }
  }

  // Method to get photo URLs for easy access
  getPhotoUrls(products) {
    return products.map(product => ({
      name: product.title,
      thumbnail: product.thumbnail_url,
      fullResolution: product.full_resolution_image,
      productUrl: product.product_url
    }));
  }

  // Method to get just the essential data
  getEssentialData(products) {
    return products.map(product => ({
      name: product.title,
      price: product.price,
      photoUrl: product.thumbnail_url,
      productUrl: product.product_url
    }));
  }
}
