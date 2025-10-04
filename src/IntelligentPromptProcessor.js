import OpenAI from 'openai';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

export class IntelligentPromptProcessor {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async processPrompt(userPrompt) {
    console.log(chalk.blue('🧠 Processing prompt with AI...'));
    console.log(chalk.gray(`Original: "${userPrompt}"`));
    console.log('');

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert e-commerce search optimizer. Your job is to take a user's natural language request for clothing/items and break it down into the most effective search queries for e-commerce sites like Amazon.

Rules:
1. Break down complex requests into individual product searches
2. Each search should be specific and optimized for e-commerce
3. Include relevant colors, brands, and product types
4. Return exactly 1 search query per distinct item requested
5. Make searches specific enough to find the exact product type
6. Use common e-commerce terminology

Example:
Input: "I want a red polo shirt with black dress pants white nike socks and jordan 4 thunders"
Output: [
  "red polo shirt men",
  "black dress pants men", 
  "white nike socks",
  "jordan 4 thunder shoes"
]

Return ONLY a JSON array of search strings, no other text.`
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const aiResponse = response.choices[0].message.content.trim();
      
      // Parse the AI response
      let searchQueries;
      try {
        searchQueries = JSON.parse(aiResponse);
      } catch (parseError) {
        // If JSON parsing fails, try to extract from text
        const matches = aiResponse.match(/\[(.*?)\]/s);
        if (matches) {
          searchQueries = JSON.parse(matches[0]);
        } else {
          throw new Error('Could not parse AI response');
        }
      }

      console.log(chalk.cyan('📋 AI-Optimized Search Queries:'));
      searchQueries.forEach((query, index) => {
        console.log(chalk.white(`${index + 1}. "${query}"`));
      });
      console.log('');

      return searchQueries;

    } catch (error) {
      console.log(chalk.yellow('⚠ AI processing failed, using fallback parser'));
      console.log(chalk.gray(`Error: ${error.message}`));
      
      // Fallback to simple parsing
      return this.fallbackParsing(userPrompt);
    }
  }

  fallbackParsing(prompt) {
    console.log(chalk.gray('Using fallback parsing...'));
    
    // Simple fallback parsing
    const normalizedPrompt = prompt.toLowerCase();
    const items = [];
    
    // Look for common patterns
    const patterns = [
      /(red|blue|green|black|white|yellow|purple|pink|orange|brown|gray|grey|navy|maroon|beige|khaki)\s+(polo\s+shirt|dress\s+pants|jeans|shorts|jacket|hoodie|sweater|dress|shirt|top|blouse|socks|shoes|sneakers)/g,
      /(nike|adidas|jordan|puma|under\s+armour|reebok)\s+(socks|shoes|sneakers|shorts|shirt|pants|jacket)/g,
      /(jordan\s+\d+\s+\w+|air\s+jordan\s+\d+\s+\w+)/g
    ];

    patterns.forEach(pattern => {
      const matches = normalizedPrompt.match(pattern);
      if (matches) {
        items.push(...matches);
      }
    });

    // If no patterns found, split by common conjunctions
    if (items.length === 0) {
      const parts = normalizedPrompt.split(/\s+(?:and|&|,|plus|with)\s+/);
      items.push(...parts.map(part => part.trim()));
    }

    return items.slice(0, 4); // Limit to 4 items max
  }

  async searchWithOptimizedQueries(searchQueries, site = 'amazon', maxPages = 1) {
    console.log(chalk.blue('🔍 Executing optimized searches with Puppeteer...'));
    console.log('');

    const { RealEcommerceScraper } = await import('./RealEcommerceScraper.js');
    const scraper = new RealEcommerceScraper({ headless: true });

    try {
      await scraper.initialize();
      
      const allProducts = [];
      
      for (let i = 0; i < searchQueries.length; i++) {
        const query = searchQueries[i];
        console.log(chalk.cyan(`Searching ${i + 1}/${searchQueries.length}: "${query}"`));
        
        try {
          const products = await scraper.searchProducts(query, site, maxPages);
          
          if (products.length > 0) {
            // Take only the first (best) result
            const bestProduct = products[0];
            allProducts.push({
              ...bestProduct,
              searchQuery: query,
              category: this.extractCategory(query)
            });
            console.log(chalk.green(`✓ Found: ${bestProduct.title}`));
          } else {
            console.log(chalk.yellow(`⚠ No results for: ${query}`));
          }
        } catch (error) {
          console.log(chalk.red(`✗ Failed: ${query} - ${error.message}`));
        }
        
        console.log('');
      }

      await scraper.close();
      return allProducts;

    } catch (error) {
      await scraper.close();
      throw error;
    }
  }

  extractCategory(query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('shirt') || queryLower.includes('polo')) return 'shirt';
    if (queryLower.includes('pants') || queryLower.includes('jeans')) return 'pants';
    if (queryLower.includes('socks')) return 'socks';
    if (queryLower.includes('shoes') || queryLower.includes('jordan') || queryLower.includes('sneakers')) return 'shoes';
    if (queryLower.includes('jacket')) return 'jacket';
    if (queryLower.includes('hoodie')) return 'hoodie';
    if (queryLower.includes('dress')) return 'dress';
    
    return 'clothing';
  }
}
