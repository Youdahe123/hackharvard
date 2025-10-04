import puppeteer from 'puppeteer';
import { PromptParser } from './PromptParser.js';
import { DataStorage } from './DataStorage.js';
import { ImageDownloader } from './ImageDownloader.js';
import chalk from 'chalk';
import ora from 'ora';

export class RealEcommerceScraper {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.options = {
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      userAgent: options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: options.viewport || { width: 1920, height: 1080 },
      ...options
    };
    this.dataStorage = new DataStorage();
    this.imageDownloader = new ImageDownloader();
    this.promptParser = new PromptParser();
  }

  async initialize() {
    const spinner = ora('Launching browser...').start();
    
    try {
      // Try to find Chrome binary
      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser'
      ];

      let executablePath = null;
      for (const path of chromePaths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(path)) {
            executablePath = path;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      const launchOptions = {
        headless: this.options.headless === true ? "new" : this.options.headless,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          '--disable-extensions',
          '--no-default-browser-check',
          '--disable-default-apps'
        ],
        timeout: 60000
      };

      if (executablePath) {
        launchOptions.executablePath = executablePath;
        console.log(chalk.gray(`Using Chrome at: ${executablePath}`));
      }

      this.browser = await puppeteer.launch(launchOptions);

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(this.options.userAgent);
      await this.page.setViewport(this.options.viewport);
      
      spinner.succeed('Browser launched successfully');
      return true;
    } catch (error) {
      spinner.fail('Failed to launch browser');
      console.log(chalk.red('Error details:'), error.message);
      console.log(chalk.yellow('Trying alternative approach...'));
      
      // Try with different options
      try {
        console.log(chalk.gray('Attempting with basic configuration...'));
        this.browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          timeout: 30000
        });
        
        this.page = await this.browser.newPage();
        await this.page.setUserAgent(this.options.userAgent);
        await this.page.setViewport(this.options.viewport);
        
        console.log(chalk.green('✓ Browser launched with basic configuration'));
        return true;
      } catch (fallbackError) {
        console.log(chalk.red('Fallback also failed:'), fallbackError.message);
        throw new Error(`Browser initialization failed: ${error.message}. Fallback error: ${fallbackError.message}`);
      }
    }
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

  async searchProducts(query, site, maxPages = 1) {
    if (!this.browser || !this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const spinner = ora(`Searching for "${query}" on ${site.toUpperCase()}...`).start();
    
    try {
      const allProducts = [];
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        console.log(`Scraping ${site.toUpperCase()} page ${pageNum}...`);
        
        const url = this.buildSearchUrl(query, site, pageNum);
        console.log(chalk.gray(`Navigating to: ${url}`));
        
        // Simple navigation approach
        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        });
        
        // Wait for page to load
        await this.page.waitForTimeout(5000);
        
        // Wait for products to load
        await this.waitForProducts(site);
        
        // Additional wait to ensure all content is loaded
        await this.page.waitForTimeout(3000);
        
        const products = await this.extractProductsFromPage(site);
        
        // Only take the first product (1 variation per search)
        const selectedProducts = products.slice(0, 1);
        
        allProducts.push(...selectedProducts);
        
        console.log(`Found ${products.length} products on page ${pageNum} (selected 1 best match)`);
        
        // Check if there are more pages
        if (pageNum < maxPages) {
          const hasNextPage = await this.hasNextPage(site);
          if (!hasNextPage) {
            console.log('No more pages available');
            break;
          }
        }
      }
      
      spinner.succeed(`Found ${allProducts.length} products`);
      console.log(chalk.green(`✓ Successfully extracted ${allProducts.length} products from ${site.toUpperCase()}`));
      
      return allProducts;
    } catch (error) {
      spinner.fail(`Failed to search products: ${error.message}`);
      throw error;
    }
  }

  buildSearchUrl(query, site, pageNum) {
    const encodedQuery = encodeURIComponent(query);
    
    if (site.toLowerCase() === 'amazon') {
      return pageNum === 1 
        ? `https://www.amazon.com/s?k=${encodedQuery}`
        : `https://www.amazon.com/s?k=${encodedQuery}&page=${pageNum}`;
    } else if (site.toLowerCase() === 'asos') {
      // Try different ASOS URL formats
      return pageNum === 1 
        ? `https://www.asos.com/us/search/?q=${encodedQuery}`
        : `https://www.asos.com/us/search/?q=${encodedQuery}&page=${pageNum}`;
    } else {
      throw new Error(`Unsupported site: ${site}`);
    }
  }

  async waitForProducts(site) {
    console.log(chalk.gray('Waiting for products to load...'));
    
    // Just wait for the page to load
    await this.page.waitForTimeout(3000);
    console.log(chalk.green('✓ Page loaded, proceeding with extraction'));
  }

  async extractProductsFromPage(site) {
    if (site.toLowerCase() === 'amazon') {
      return await this.extractAmazonProducts();
    } else if (site.toLowerCase() === 'asos') {
      return await this.extractASOSProducts();
    } else {
      throw new Error(`Unsupported site: ${site}`);
    }
  }

  async extractAmazonProducts() {
    return await this.page.evaluate(() => {
      const products = [];
      
      // Multiple selectors to handle different Amazon layouts
      const productSelectors = [
        '[data-component-type="s-search-result"]',
        '.s-result-item',
        '[data-asin]'
      ];
      
      let productElements = [];
      for (const selector of productSelectors) {
        productElements = document.querySelectorAll(selector);
        if (productElements.length > 0) break;
      }
      
      productElements.forEach((element, index) => {
        try {
          // Skip sponsored ads and non-product items
          if (element.querySelector('[data-component-type="sp-sponsored-result"]') ||
              element.querySelector('.AdHolder') ||
              element.classList.contains('AdHolder')) {
            return;
          }
          
          // Extract product URL
          const linkElement = element.querySelector('h2 a') ||
                             element.querySelector('a[href*="/dp/"]') ||
                             element.querySelector('a[href*="/gp/product/"]') ||
                             element.querySelector('a');
          
          if (!linkElement) return;
          
          let productHref = linkElement.getAttribute('href');
          if (productHref && !productHref.startsWith('http')) {
            productHref = 'https://www.amazon.com' + productHref;
          }
          
          // Extract product title
          const titleElement = element.querySelector('h2 a span') ||
                              element.querySelector('.s-size-mini .s-color-base') ||
                              element.querySelector('[data-cy="title-recipe-title"]') ||
                              element.querySelector('h2 span') ||
                              element.querySelector('.s-title-instructions-style');
          
          const title = titleElement ? titleElement.textContent.trim() : '';
          
          // Extract thumbnail image and get full resolution URL
          const imgElement = element.querySelector('img[data-image-latency]') ||
                            element.querySelector('.s-image img') ||
                            element.querySelector('img[src*="images-amazon.com"]') ||
                            element.querySelector('img');
          
          let thumbnail = '';
          let fullResolutionImage = '';
          let imageClickUrl = '';
          
          if (imgElement) {
            thumbnail = imgElement.getAttribute('src') || 
                       imgElement.getAttribute('data-src') ||
                       imgElement.getAttribute('data-lazy');
            
            // Handle relative URLs
            if (thumbnail && !thumbnail.startsWith('http')) {
              thumbnail = 'https:' + thumbnail;
            }
            
            // Get full resolution image URL (Amazon often has higher res versions)
            if (thumbnail) {
              // Convert thumbnail to full resolution by removing size parameters
              fullResolutionImage = thumbnail
                .replace(/\._[A-Z0-9_]+\.jpg/, '.jpg') // Remove Amazon size suffixes
                .replace(/\._AC_[A-Z0-9_]+\.jpg/, '.jpg')
                .replace(/\._AC_SX[0-9]+\.jpg/, '.jpg')
                .replace(/\._AC_SY[0-9]+\.jpg/, '.jpg')
                .replace(/\._AC_UX[0-9]+\.jpg/, '.jpg')
                .replace(/\._AC_UY[0-9]+\.jpg/, '.jpg');
            }
            
            // Check if image is clickable and has a URL
            const clickableParent = imgElement.closest('a');
            if (clickableParent) {
              imageClickUrl = clickableParent.getAttribute('href');
              if (imageClickUrl && !imageClickUrl.startsWith('http')) {
                imageClickUrl = 'https://www.amazon.com' + imageClickUrl;
              }
            }
          }
          
          // Extract price
          const priceElement = element.querySelector('.a-price-whole') ||
                              element.querySelector('.a-price .a-offscreen') ||
                              element.querySelector('.a-price-range');
          const price = priceElement ? priceElement.textContent.trim() : null;
          
          // Extract rating
          const ratingElement = element.querySelector('.a-icon-alt');
          const rating = ratingElement ? ratingElement.textContent.trim() : null;
          
          // Only add if we have essential data
          if (productHref && title && thumbnail) {
            products.push({
              product_href: productHref,
              title: title,
              thumbnail: thumbnail,
              full_resolution_image: fullResolutionImage,
              image_click_url: imageClickUrl,
              price: price,
              rating: rating
            });
          }
        } catch (error) {
          console.warn(`Error extracting product ${index}:`, error);
        }
      });
      
      return products;
    });
  }

  async getDetailedProductInfo(productUrl, site) {
    console.log(chalk.gray(`Getting detailed info for: ${productUrl}`));
    
    try {
      // Navigate to product page
      await this.page.goto(productUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      // Wait for page to fully load
      await this.page.waitForTimeout(5000);
      
      // Wait for page to be ready
      await this.page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
      
      if (site.toLowerCase() === 'amazon') {
        return await this.extractAmazonProductDetails();
      } else if (site.toLowerCase() === 'asos') {
        return await this.extractASOSProductDetails();
      }
    } catch (error) {
      console.log(chalk.yellow(`Failed to get details for ${productUrl}: ${error.message}`));
      return {};
    }
  }

  async extractAmazonProductDetails() {
    return await this.page.evaluate(() => {
      const details = {};
      
      // Extract detailed price
      const priceElement = document.querySelector('#priceblock_dealprice') ||
                          document.querySelector('#priceblock_ourprice') ||
                          document.querySelector('.a-price-whole') ||
                          document.querySelector('#apex_desktop .a-price-whole') ||
                          document.querySelector('.a-price .a-offscreen');
      details.price = priceElement ? priceElement.textContent.trim() : null;
      
      // Extract brand
      const brandElement = document.querySelector('#bylineInfo') ||
                          document.querySelector('.a-size-base.a-color-secondary') ||
                          document.querySelector('#brand');
      details.brand = brandElement ? brandElement.textContent.trim() : null;
      
      // Extract description
      const descElement = document.querySelector('#feature-bullets ul') ||
                         document.querySelector('#productDescription p') ||
                         document.querySelector('#aplus_feature_div');
      details.description = descElement ? descElement.textContent.trim() : null;
      
      // Extract availability
      const availabilityElement = document.querySelector('#availability span');
      details.availability = availabilityElement ? availabilityElement.textContent.trim() : null;
      
      // Extract size options
      const sizeElements = document.querySelectorAll('#variation_size_name .a-button-text, #size_name_0 .a-button-text');
      details.sizes = Array.from(sizeElements).map(el => el.textContent.trim());
      
      // Extract color options
      const colorElements = document.querySelectorAll('#variation_color_name .a-button-text, #color_name_0 .a-button-text');
      details.colors = Array.from(colorElements).map(el => el.textContent.trim());
      
      // Extract main product image
      const mainImageElement = document.querySelector('#landingImage') ||
                              document.querySelector('#imgTagWrapperId img') ||
                              document.querySelector('.a-dynamic-image');
      details.mainImage = mainImageElement ? mainImageElement.getAttribute('src') : null;
      
      // Extract all product images with their URLs
      const imageElements = document.querySelectorAll('#altImages img, #imageBlock img, #imageBlockThumbs img');
      details.allImages = Array.from(imageElements).map(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src) {
          // Convert to full resolution
          return src
            .replace(/\._[A-Z0-9_]+\.jpg/, '.jpg')
            .replace(/\._AC_[A-Z0-9_]+\.jpg/, '.jpg')
            .replace(/\._AC_SX[0-9]+\.jpg/, '.jpg')
            .replace(/\._AC_SY[0-9]+\.jpg/, '.jpg')
            .replace(/\._AC_UX[0-9]+\.jpg/, '.jpg')
            .replace(/\._AC_UY[0-9]+\.jpg/, '.jpg');
        }
        return src;
      }).filter(src => src);
      
      // Extract clickable image URLs
      const clickableImages = document.querySelectorAll('#altImages a, #imageBlock a');
      details.clickableImageUrls = Array.from(clickableImages).map(link => {
        const href = link.getAttribute('href');
        return href ? (href.startsWith('http') ? href : 'https://www.amazon.com' + href) : null;
      }).filter(url => url);
      
      // Extract rating and review count
      const ratingElement = document.querySelector('.a-icon-alt');
      details.rating = ratingElement ? ratingElement.textContent.trim() : null;
      
      const reviewCountElement = document.querySelector('#acrCustomerReviewText');
      details.reviewCount = reviewCountElement ? reviewCountElement.textContent.trim() : null;
      
      // Extract product specifications
      const specRows = document.querySelectorAll('#productDetails_detailBullets_sections1 tr, #productDetails_techSpec_section_1 tr');
      details.specifications = {};
      specRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const key = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          if (key && value) {
            details.specifications[key] = value;
          }
        }
      });
      
      return details;
    });
  }

  async extractASOSProductDetails() {
    return await this.page.evaluate(() => {
      const details = {};
      
      // Extract detailed price
      const priceElement = document.querySelector('[data-testid="current-price"]') ||
                          document.querySelector('.current-price') ||
                          document.querySelector('[data-auto-id="productPrice"]');
      details.price = priceElement ? priceElement.textContent.trim() : null;
      
      // Extract brand
      const brandElement = document.querySelector('[data-testid="productBrand"]') ||
                          document.querySelector('.product-brand') ||
                          document.querySelector('[data-auto-id="productBrand"]');
      details.brand = brandElement ? brandElement.textContent.trim() : null;
      
      // Extract description
      const descElement = document.querySelector('[data-testid="productDescription"]') ||
                         document.querySelector('.product-description') ||
                         document.querySelector('[data-auto-id="productDescription"]');
      details.description = descElement ? descElement.textContent.trim() : null;
      
      // Extract size options
      const sizeElements = document.querySelectorAll('[data-testid="sizeSelector"] button, .size-selector button');
      details.sizes = Array.from(sizeElements).map(el => el.textContent.trim());
      
      // Extract color options
      const colorElements = document.querySelectorAll('[data-testid="colourSelector"] button, .colour-selector button');
      details.colors = Array.from(colorElements).map(el => el.textContent.trim());
      
      // Extract main product image
      const mainImageElement = document.querySelector('[data-testid="productImage"] img') ||
                              document.querySelector('.product-image img');
      details.mainImage = mainImageElement ? mainImageElement.getAttribute('src') : null;
      
      // Extract all product images
      const imageElements = document.querySelectorAll('[data-testid="productImageGallery"] img, .product-gallery img');
      details.allImages = Array.from(imageElements).map(img => img.getAttribute('src')).filter(src => src);
      
      // Extract rating
      const ratingElement = document.querySelector('[data-testid="productRating"]') ||
                          document.querySelector('.product-rating');
      details.rating = ratingElement ? ratingElement.textContent.trim() : null;
      
      return details;
    });
  }

  async extractASOSProducts() {
    return await this.page.evaluate(() => {
      const products = [];
      
      // Multiple selectors to handle different ASOS layouts
      const productSelectors = [
        '[data-testid="productTile"]',
        'article[data-auto-id="productTile"]',
        '.productTile',
        '[data-auto-id="productTile"]'
      ];
      
      let productElements = [];
      for (const selector of productSelectors) {
        productElements = document.querySelectorAll(selector);
        if (productElements.length > 0) break;
      }
      
      productElements.forEach((element, index) => {
        try {
          // Extract product URL
          const linkElement = element.querySelector('a[href*="/prd/"]') || 
                             element.querySelector('a[href*="/product/"]') ||
                             element.querySelector('a');
          
          if (!linkElement) return;
          
          let productHref = linkElement.getAttribute('href');
          if (productHref && !productHref.startsWith('http')) {
            productHref = 'https://www.asos.com' + productHref;
          }
          
          // Extract product title
          const titleElement = element.querySelector('[data-testid="productTileTitle"]') ||
                              element.querySelector('h3') ||
                              element.querySelector('.productTile-title') ||
                              element.querySelector('[data-auto-id="productTileTitle"]') ||
                              element.querySelector('p[data-auto-id="productTileTitle"]');
          
          const title = titleElement ? titleElement.textContent.trim() : '';
          
          // Extract thumbnail image
          const imgElement = element.querySelector('img[data-testid="productTileImage"]') ||
                            element.querySelector('img[data-auto-id="productTileImage"]') ||
                            element.querySelector('img') ||
                            element.querySelector('picture img');
          
          let thumbnail = '';
          if (imgElement) {
            thumbnail = imgElement.getAttribute('src') || 
                       imgElement.getAttribute('data-src') ||
                       imgElement.getAttribute('data-lazy');
            
            // Handle relative URLs
            if (thumbnail && !thumbnail.startsWith('http')) {
              thumbnail = 'https:' + thumbnail;
            }
          }
          
          // Extract price
          const priceElement = element.querySelector('[data-testid="current-price"]') ||
                              element.querySelector('.current-price') ||
                              element.querySelector('[data-auto-id="productPrice"]');
          const price = priceElement ? priceElement.textContent.trim() : null;
          
          // Extract rating
          const ratingElement = element.querySelector('[data-testid="productRating"]') ||
                              element.querySelector('.product-rating');
          const rating = ratingElement ? ratingElement.textContent.trim() : null;
          
          // Only add if we have essential data
          if (productHref && title && thumbnail) {
            products.push({
              product_href: productHref,
              title: title,
              thumbnail: thumbnail,
              price: price,
              rating: rating
            });
          }
        } catch (error) {
          console.warn(`Error extracting product ${index}:`, error);
        }
      });
      
      return products;
    });
  }

  async hasNextPage(site) {
    return await this.page.evaluate(() => {
      if (window.location.hostname.includes('amazon.com')) {
        const nextButton = document.querySelector('.s-pagination-next') ||
                          document.querySelector('a[aria-label="Go to next page"]') ||
                          document.querySelector('.a-pagination .a-last a');
        
        return nextButton && !nextButton.classList.contains('a-disabled');
      } else if (window.location.hostname.includes('asos.com')) {
        const nextButton = document.querySelector('[data-testid="paginationNext"]') ||
                          document.querySelector('.pagination-next') ||
                          document.querySelector('a[aria-label="Next page"]');
        
        return nextButton && !nextButton.disabled && !nextButton.classList.contains('disabled');
      }
      return false;
    });
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

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log(chalk.blue('🔒 Browser closed'));
    }
  }
}
