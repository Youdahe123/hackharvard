export class AmazonScraper {
  constructor() {
    this.baseUrl = 'https://www.amazon.com';
    this.searchUrl = 'https://www.amazon.com/s';
  }

  async scrapeProducts(page, query, maxPages = 1) {
    const allProducts = [];
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`Scraping Amazon page ${pageNum}...`);
      
      const url = pageNum === 1 
        ? `${this.searchUrl}?k=${encodeURIComponent(query)}`
        : `${this.searchUrl}?k=${encodeURIComponent(query)}&page=${pageNum}`;
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      // Handle potential captcha or bot detection
      await this.handleBotDetection(page);
      
      // Wait for products to load
      await this.waitForProducts(page);
      
      const products = await this.extractProductsFromPage(page);
      allProducts.push(...products);
      
      console.log(`Found ${products.length} products on page ${pageNum}`);
      
      // Check if there are more pages
      if (pageNum < maxPages) {
        const hasNextPage = await this.hasNextPage(page);
        if (!hasNextPage) {
          console.log('No more pages available');
          break;
        }
      }
    }
    
    return allProducts;
  }

  async handleBotDetection(page) {
    // Check for captcha or bot detection
    const captchaDetected = await page.evaluate(() => {
      return document.querySelector('#captcha') !== null ||
             document.querySelector('.a-alert-error') !== null ||
             document.body.textContent.includes('robot') ||
             document.body.textContent.includes('captcha');
    });

    if (captchaDetected) {
      console.log('Bot detection detected. Waiting for manual intervention...');
      await page.waitForTimeout(5000);
    }
  }

  async waitForProducts(page) {
    try {
      // Wait for product containers to appear
      await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 10000 });
    } catch (error) {
      // Fallback selectors
      try {
        await page.waitForSelector('.s-result-item', { timeout: 5000 });
      } catch (fallbackError) {
        await page.waitForSelector('[data-asin]', { timeout: 5000 });
      }
    }
    
    // Additional wait for dynamic content
    await page.waitForTimeout(2000);
  }

  async extractProductsFromPage(page) {
    return await page.evaluate(() => {
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
          
          // Extract thumbnail image
          const imgElement = element.querySelector('img[data-image-latency]') ||
                            element.querySelector('.s-image img') ||
                            element.querySelector('img[src*="images-amazon.com"]') ||
                            element.querySelector('img');
          
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
          
          // Extract price for additional context
          const priceElement = element.querySelector('.a-price-whole') ||
                              element.querySelector('.a-price .a-offscreen') ||
                              element.querySelector('.a-price-range');
          const price = priceElement ? priceElement.textContent.trim() : null;
          
          // Extract rating
          const ratingElement = element.querySelector('.a-icon-alt');
          const rating = ratingElement ? ratingElement.textContent.trim() : null;
          
          // Only add if we have essential data
          if (productHref && title) {
            products.push({
              product_href: productHref,
              title: title,
              thumbnail: thumbnail || null,
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

  async hasNextPage(page) {
    return await page.evaluate(() => {
      const nextButton = document.querySelector('.s-pagination-next') ||
                        document.querySelector('a[aria-label="Go to next page"]') ||
                        document.querySelector('.a-pagination .a-last a');
      
      return nextButton && !nextButton.classList.contains('a-disabled');
    });
  }

  // Method to get product details from individual product page
  async getProductDetails(page, productUrl) {
    try {
      await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      return await page.evaluate(() => {
        const details = {};
        
        // Extract price
        const priceElement = document.querySelector('#priceblock_dealprice') ||
                            document.querySelector('#priceblock_ourprice') ||
                            document.querySelector('.a-price-whole') ||
                            document.querySelector('#apex_desktop .a-price-whole');
        details.price = priceElement ? priceElement.textContent.trim() : null;
        
        // Extract brand
        const brandElement = document.querySelector('#bylineInfo') ||
                            document.querySelector('.a-size-base.a-color-secondary');
        details.brand = brandElement ? brandElement.textContent.trim() : null;
        
        // Extract description
        const descElement = document.querySelector('#feature-bullets ul') ||
                           document.querySelector('#productDescription p');
        details.description = descElement ? descElement.textContent.trim() : null;
        
        // Extract availability
        const availabilityElement = document.querySelector('#availability span');
        details.availability = availabilityElement ? availabilityElement.textContent.trim() : null;
        
        return details;
      });
    } catch (error) {
      console.warn(`Failed to get product details for ${productUrl}:`, error);
      return {};
    }
  }

  // Method to handle Amazon's dynamic loading
  async scrollToLoadMore(page) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(2000);
    
    // Check if more products loaded
    return await page.evaluate(() => {
      const newProducts = document.querySelectorAll('[data-component-type="s-search-result"]');
      return newProducts.length;
    });
  }
}

