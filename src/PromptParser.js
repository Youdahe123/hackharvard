export class PromptParser {
  constructor() {
    this.colorKeywords = {
      'red': ['red', 'crimson', 'burgundy', 'maroon'],
      'blue': ['blue', 'navy', 'royal', 'sky', 'denim'],
      'green': ['green', 'emerald', 'forest', 'mint', 'olive'],
      'black': ['black', 'charcoal', 'dark'],
      'white': ['white', 'cream', 'ivory', 'off-white'],
      'yellow': ['yellow', 'gold', 'mustard'],
      'purple': ['purple', 'violet', 'lavender'],
      'pink': ['pink', 'rose', 'magenta'],
      'orange': ['orange', 'peach', 'coral'],
      'brown': ['brown', 'tan', 'beige', 'khaki'],
      'gray': ['gray', 'grey', 'silver', 'slate']
    };

    this.categoryKeywords = {
      'hoodie': ['hoodie', 'hooded', 'sweatshirt', 'pullover'],
      'jeans': ['jeans', 'denim', 'pants', 'trousers'],
      'shirt': ['shirt', 'blouse', 'top', 'tee', 't-shirt', 'polo shirt', 'polo'],
      'jacket': ['jacket', 'blazer', 'coat', 'outerwear'],
      'shoes': ['shoes', 'sneakers', 'boots', 'sandals', 'heels', 'jordan', 'air jordan'],
      'dress': ['dress', 'gown', 'frock'],
      'shorts': ['shorts', 'bermuda'],
      'skirt': ['skirt', 'mini', 'maxi'],
      'sweater': ['sweater', 'cardigan', 'jumper'],
      'pants': ['pants', 'trousers', 'slacks', 'chinos', 'dress pants'],
      'socks': ['socks', 'sock']
    };

    this.brandKeywords = {
      'nike': ['nike', 'air jordan'],
      'adidas': ['adidas', 'originals'],
      'zara': ['zara'],
      'h&m': ['h&m', 'hm', 'h and m'],
      'uniqlo': ['uniqlo'],
      'levis': ['levis', 'levi\'s'],
      'gap': ['gap'],
      'tommy hilfiger': ['tommy hilfiger', 'tommy'],
      'calvin klein': ['calvin klein', 'ck'],
      'ralph lauren': ['ralph lauren', 'polo'],
      'gucci': ['gucci'],
      'prada': ['prada'],
      'versace': ['versace'],
      'balenciaga': ['balenciaga'],
      'off-white': ['off-white', 'off white']
    };

    this.sizeKeywords = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large', 'extra large'];
  }

  parsePrompt(prompt) {
    const normalizedPrompt = prompt.toLowerCase();
    const requests = [];

    // Enhanced parsing for complex prompts
    // Look for specific patterns like "red polo shirt", "black dress pants", etc.
    const patterns = [
      // Color + item patterns
      /(red|blue|green|black|white|yellow|purple|pink|orange|brown|gray|grey|navy|maroon|beige|khaki)\s+(polo\s+shirt|dress\s+pants|jeans|shorts|jacket|hoodie|sweater|dress|shirt|top|blouse)/g,
      // Brand + item patterns  
      /(nike|adidas|jordan|puma|under\s+armour|reebok)\s+(socks|shoes|sneakers|shorts|shirt|pants|jacket)/g,
      // Specific product patterns
      /(jordan\s+\d+\s+\w+|air\s+jordan\s+\d+\s+\w+)/g,
      // Generic item patterns
      /(polo\s+shirt|dress\s+pants|nike\s+socks|jordan\s+\d+)/g
    ];

    let foundItems = [];
    
    // Extract items using patterns
    patterns.forEach(pattern => {
      const matches = normalizedPrompt.match(pattern);
      if (matches) {
        foundItems.push(...matches);
      }
    });

    // If no patterns found, try splitting by conjunctions
    if (foundItems.length === 0) {
      const parts = normalizedPrompt.split(/\s+(?:and|&|,|plus|with)\s+/);
      foundItems = parts.map(part => part.trim());
    }

    // Parse each found item
    for (const item of foundItems) {
      const request = this.parseSingleRequest(item);
      if (request) {
        requests.push(request);
      }
    }

    return requests;
  }

  parseSingleRequest(text) {
    const request = {
      category: null,
      color: null,
      brand: null,
      size: null,
      keywords: []
    };

    // Extract color
    for (const [color, keywords] of Object.entries(this.colorKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          request.color = color;
          break;
        }
      }
      if (request.color) break;
    }

    // Extract category
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          request.category = category;
          break;
        }
      }
      if (request.category) break;
    }

    // Extract brand
    for (const [brand, keywords] of Object.entries(this.brandKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          request.brand = brand;
          break;
        }
      }
      if (request.brand) break;
    }

    // Extract size
    for (const size of this.sizeKeywords) {
      if (text.includes(size)) {
        request.size = size;
        break;
      }
    }

    // Extract additional keywords
    const words = text.split(/\s+/);
    request.keywords = words.filter(word => 
      word.length > 2 && 
      !Object.values(this.colorKeywords).flat().includes(word) &&
      !Object.values(this.categoryKeywords).flat().includes(word) &&
      !Object.values(this.brandKeywords).flat().includes(word) &&
      !this.sizeKeywords.includes(word)
    );

    // Only return if we have at least a category or meaningful keywords
    if (request.category || request.keywords.length > 0) {
      return request;
    }

    return null;
  }

  generateSearchQuery(request) {
    const parts = [];

    if (request.color) {
      parts.push(request.color);
    }

    if (request.category) {
      parts.push(request.category);
    }

    if (request.brand) {
      parts.push(request.brand);
    }

    if (request.size) {
      parts.push(`size ${request.size}`);
    }

    // Add additional keywords
    parts.push(...request.keywords);

    return parts.join(' ');
  }

  // Method to extract structured data from product information
  extractProductDetails(product, request) {
    const details = {
      name: product.title || '',
      category: this.extractCategory(product.title, request),
      brand: this.extractBrand(product.title),
      price: this.extractPrice(product.price),
      size: this.extractSize(product.title, request),
      color: this.extractColor(product.title, request),
      thumbnail_url: product.thumbnail || '',
      product_url: product.product_href || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return details;
  }

  extractCategory(title, request) {
    if (request && request.category) {
      return request.category;
    }

    const titleLower = title.toLowerCase();
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) {
          return category;
        }
      }
    }

    return 'clothing'; // Default category
  }

  extractBrand(title) {
    const titleLower = title.toLowerCase();
    for (const [brand, keywords] of Object.entries(this.brandKeywords)) {
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) {
          return brand;
        }
      }
    }

    return 'unknown';
  }

  extractPrice(priceString) {
    if (!priceString) return null;
    
    // Extract numeric value from price string
    const match = priceString.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : null;
  }

  extractSize(title, request) {
    if (request && request.size) {
      return request.size;
    }

    const titleLower = title.toLowerCase();
    for (const size of this.sizeKeywords) {
      if (titleLower.includes(size)) {
        return size;
      }
    }

    return null;
  }

  extractColor(title, request) {
    if (request && request.color) {
      return request.color;
    }

    const titleLower = title.toLowerCase();
    for (const [color, keywords] of Object.entries(this.colorKeywords)) {
      for (const keyword of keywords) {
        if (titleLower.includes(keyword)) {
          return color;
        }
      }
    }

    return null;
  }
}
