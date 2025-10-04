export class ASOSScraper {
  constructor() {
    this.baseUrl = 'https://www.asos.com';
    this.searchUrl = 'https://www.asos.com/search';
  }

  async scrapeProducts(page, query, maxPages = 1) {
    const allProducts = [];
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`Scraping ASOS page ${pageNum}...`);
      
      const url = pageNum === 1 
        ? `${this.searchUrl}?q=${encodeURIComponent(query)}`
        : `${this.searchUrl}?q=${encodeURIComponent(query)}&page=${pageNum}`;
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
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

  async waitForProducts(page) {
    try {
      // Wait for product containers to appear
      await page.waitForSelector('[data-testid="productTile"]', { timeout: 10000 });
    } catch (error) {
      // Fallback selectors if the primary one fails
      try {
        await page.waitForSelector('article[data-auto-id="productTile"]', { timeout: 5000 });
      } catch (fallbackError) {
        await page.waitForSelector('.productTile', { timeout: 5000 });
      }
    }
    
    // Additional wait for dynamic content
    await page.waitForTimeout(2000);
  }

  async extractProductsFromPage(page) {
    return await page.evaluate(() => {
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
          
          // Only add if we have essential data
          if (productHref && title) {
            products.push({
              product_href: productHref,
              title: title,
              thumbnail: thumbnail || null
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
      const nextButton = document.querySelector('[data-testid="paginationNext"]') ||
                        document.querySelector('.pagination-next') ||
                        document.querySelector('a[aria-label="Next page"]');
      
      return nextButton && !nextButton.disabled && !nextButton.classList.contains('disabled');
    });
  }

  // Method to get product details from individual product page
  async getProductDetails(page, productUrl) {
    try {
      await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      return await page.evaluate(() => {
        const details = {};
        
        // Extract price
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
        
        return details;
      });
    } catch (error) {
      console.warn(`Failed to get product details for ${productUrl}:`, error);
      return {};
    }
  }
}

