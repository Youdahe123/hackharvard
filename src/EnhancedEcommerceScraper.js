import { EcommerceScraper } from './EcommerceScraper.js';
import { PromptParser } from './PromptParser.js';
import chalk from 'chalk';
import ora from 'ora';

export class EnhancedEcommerceScraper extends EcommerceScraper {
  constructor(options = {}) {
    super(options);
    this.promptParser = new PromptParser();
  }

  async searchFromPrompt(prompt, site = 'asos', maxPages = 1) {
    console.log(chalk.blue('🎯 Parsing natural language request...'));
    console.log(chalk.gray(`Prompt: "${prompt}"`));
    console.log('');

    // Parse the prompt into structured requests
    const requests = this.promptParser.parsePrompt(prompt);
    
    if (requests.length === 0) {
      throw new Error('Could not parse the request. Please be more specific about what you want.');
    }

    console.log(chalk.cyan('📋 Parsed Requests:'));
    requests.forEach((request, index) => {
      console.log(chalk.white(`${index + 1}. ${this.promptParser.generateSearchQuery(request)}`));
      if (request.color) console.log(chalk.gray(`   Color: ${request.color}`));
      if (request.category) console.log(chalk.gray(`   Category: ${request.category}`));
      if (request.brand) console.log(chalk.gray(`   Brand: ${request.brand}`));
      if (request.size) console.log(chalk.gray(`   Size: ${request.size}`));
      console.log('');
    });

    const allProducts = [];

    // Search for each parsed request
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const searchQuery = this.promptParser.generateSearchQuery(request);
      
      console.log(chalk.cyan(`🔍 Searching for: "${searchQuery}"`));
      
      try {
        const products = await this.searchProducts(searchQuery, site, maxPages);
        
        // Enhance products with structured data
        const enhancedProducts = products.map(product => {
          const enhanced = this.promptParser.extractProductDetails(product, request);
          return {
            ...enhanced,
            searchQuery: searchQuery,
            originalRequest: request
          };
        });
        
        allProducts.push(...enhancedProducts);
        console.log(chalk.green(`✓ Found ${enhancedProducts.length} products for "${searchQuery}"`));
        
      } catch (error) {
        console.log(chalk.red(`✗ Failed to search for "${searchQuery}": ${error.message}`));
      }
      
      console.log('');
    }

    return allProducts;
  }

  async saveEnhancedProducts(products, format = 'json', filename = null) {
    if (!products || products.length === 0) {
      console.log(chalk.yellow('⚠ No products to save'));
      return;
    }

    const spinner = ora(`Saving ${products.length} enhanced products to ${format.toUpperCase()}...`).start();
    
    try {
      // Create enhanced data structure
      const enhancedData = {
        timestamp: new Date().toISOString(),
        total_products: products.length,
        search_requests: [...new Set(products.map(p => p.searchQuery))],
        products: products.map(product => ({
          name: product.name,
          category: product.category,
          brand: product.brand,
          price: product.price,
          size: product.size,
          color: product.color,
          thumbnail_url: product.thumbnail_url,
          product_url: product.product_url,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          searchQuery: product.searchQuery,
          originalRequest: product.originalRequest
        }))
      };

      const result = await this.dataStorage.save(enhancedData, format, filename);
      spinner.succeed(`Enhanced products saved successfully`);
      console.log(chalk.green(`✓ Saved to: ${result}`));
      return result;
    } catch (error) {
      spinner.fail(`Failed to save enhanced products: ${error.message}`);
      throw error;
    }
  }

  // Method to get products by category
  getProductsByCategory(products, category) {
    return products.filter(product => 
      product.category && product.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Method to get products by color
  getProductsByColor(products, color) {
    return products.filter(product => 
      product.color && product.color.toLowerCase() === color.toLowerCase()
    );
  }

  // Method to get products by brand
  getProductsByBrand(products, brand) {
    return products.filter(product => 
      product.brand && product.brand.toLowerCase() === brand.toLowerCase()
    );
  }

  // Method to get products by price range
  getProductsByPriceRange(products, minPrice, maxPrice) {
    return products.filter(product => {
      if (!product.price) return false;
      return product.price >= minPrice && product.price <= maxPrice;
    });
  }

  // Method to display enhanced product summary
  displayProductSummary(products) {
    console.log(chalk.blue('📊 Product Summary:'));
    console.log('');

    // Category breakdown
    const categories = {};
    const colors = {};
    const brands = {};
    let totalValue = 0;

    products.forEach(product => {
      // Categories
      if (product.category) {
        categories[product.category] = (categories[product.category] || 0) + 1;
      }

      // Colors
      if (product.color) {
        colors[product.color] = (colors[product.color] || 0) + 1;
      }

      // Brands
      if (product.brand && product.brand !== 'unknown') {
        brands[product.brand] = (brands[product.brand] || 0) + 1;
      }

      // Total value
      if (product.price) {
        totalValue += product.price;
      }
    });

    console.log(chalk.cyan('📂 Categories:'));
    Object.entries(categories).forEach(([category, count]) => {
      console.log(chalk.gray(`  ${category}: ${count} products`));
    });

    console.log('');
    console.log(chalk.cyan('🎨 Colors:'));
    Object.entries(colors).forEach(([color, count]) => {
      console.log(chalk.gray(`  ${color}: ${count} products`));
    });

    console.log('');
    console.log(chalk.cyan('🏷️  Brands:'));
    Object.entries(brands).forEach(([brand, count]) => {
      console.log(chalk.gray(`  ${brand}: ${count} products`));
    });

    console.log('');
    console.log(chalk.cyan('💰 Price Summary:'));
    const prices = products.filter(p => p.price).map(p => p.price);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      console.log(chalk.gray(`  Min: $${minPrice.toFixed(2)}`));
      console.log(chalk.gray(`  Max: $${maxPrice.toFixed(2)}`));
      console.log(chalk.gray(`  Average: $${avgPrice.toFixed(2)}`));
      console.log(chalk.gray(`  Total Value: $${totalValue.toFixed(2)}`));
    }

    console.log('');
  }
}
