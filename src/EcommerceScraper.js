import puppeteer from 'puppeteer';
import { ASOSScraper } from '../scrapers/ASOSScraper.js';
import { AmazonScraper } from '../scrapers/AmazonScraper.js';
import { DataStorage } from './DataStorage.js';
import { ImageDownloader } from './ImageDownloader.js';
import chalk from 'chalk';
import ora from 'ora';

export class EcommerceScraper {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.options = {
      headless: options.headless !== false, // Default to headless
      timeout: options.timeout || 30000,
      userAgent: options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: options.viewport || { width: 1920, height: 1080 },
      ...options
    };
    this.dataStorage = new DataStorage();
    this.imageDownloader = new ImageDownloader();
    this.scrapers = {
      asos: new ASOSScraper(),
      amazon: new AmazonScraper()
    };
  }

  async initialize() {
    const spinner = ora('Launching browser...').start();
    
    try {
      this.browser = await puppeteer.launch({
        headless: this.options.headless === true ? "new" : this.options.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(this.options.userAgent);
      await this.page.setViewport(this.options.viewport);
      
      // Set request interception to block unnecessary resources (optional)
      // await this.page.setRequestInterception(true);
      // this.page.on('request', (request) => {
      //   const resourceType = request.resourceType();
      //   if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      //     request.abort();
      //   } else {
      //     request.continue();
      //   }
      // });

      spinner.succeed('Browser launched successfully');
      return true;
    } catch (error) {
      spinner.fail('Failed to launch browser');
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  async searchProducts(query, site = 'asos', maxPages = 1) {
    if (!this.browser || !this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const spinner = ora(`Searching for "${query}" on ${site.toUpperCase()}...`).start();
    
    try {
      const scraper = this.scrapers[site.toLowerCase()];
      if (!scraper) {
        throw new Error(`Unsupported site: ${site}. Supported sites: ${Object.keys(this.scrapers).join(', ')}`);
      }

      const products = await scraper.scrapeProducts(this.page, query, maxPages);
      
      spinner.succeed(`Found ${products.length} products`);
      console.log(chalk.green(`✓ Successfully extracted ${products.length} products from ${site.toUpperCase()}`));
      
      return products;
    } catch (error) {
      spinner.fail(`Failed to search products: ${error.message}`);
      throw error;
    }
  }

  async saveProducts(products, format = 'json', filename = null) {
    if (!products || products.length === 0) {
      console.log(chalk.yellow('⚠ No products to save'));
      return;
    }

    const spinner = ora(`Saving ${products.length} products to ${format.toUpperCase()}...`).start();
    
    try {
      const result = await this.dataStorage.save(products, format, filename);
      spinner.succeed(`Products saved successfully`);
      console.log(chalk.green(`✓ Saved to: ${result}`));
      return result;
    } catch (error) {
      spinner.fail(`Failed to save products: ${error.message}`);
      throw error;
    }
  }

  async downloadProductImages(products, options = {}) {
    if (!products || products.length === 0) {
      console.log(chalk.yellow('⚠ No products to download images for'));
      return [];
    }

    try {
      const downloadedImages = await this.imageDownloader.downloadProductImages(products, options);
      console.log(chalk.green(`✓ Downloaded ${downloadedImages.length} product images`));
      return downloadedImages;
    } catch (error) {
      console.error(chalk.red('❌ Failed to download images:'), error.message);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log(chalk.blue('🔒 Browser closed'));
    }
  }

  // Utility method to wait for page to be fully loaded
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000); // Additional wait for dynamic content
  }

  // Method to handle retries with exponential backoff
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(chalk.yellow(`⚠ Attempt ${attempt} failed, retrying in ${delay}ms...`));
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
}

