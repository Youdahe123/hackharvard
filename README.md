# E-commerce Scraper Agent

An AI-powered agent that automates e-commerce product search and extraction using Puppeteer. This tool can search for products on ASOS and Amazon, extract product information, and save the results in multiple formats.

## Features

- 🔍 **Automated Product Search**: Search for products using natural language queries
- 🛍️ **Multi-Site Support**: Currently supports ASOS and Amazon
- 📊 **Multiple Output Formats**: Save results as JSON, CSV, or SQLite database
- 🤖 **Puppeteer-Powered**: Handles JavaScript-heavy sites with dynamic content
- 🎯 **Structured Data**: Extracts product URL, title, thumbnail, price, and rating
- 🖥️ **CLI Interface**: Easy-to-use command-line interface
- 🔄 **Interactive Mode**: Interactive session for multiple searches
- ⚡ **Error Handling**: Comprehensive error handling with retry logic
- 📈 **Pagination Support**: Scrape multiple pages of results

## Installation

1. **Clone or download the project**:
   ```bash
   git clone <repository-url>
   cd ecommerce-scraper-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify installation**:
   ```bash
   npm test
   ```

## Quick Start

### Basic Search
```bash
# Search for men's jackets on ASOS
npm start search -q "men puffer jacket" -s asos

# Search on Amazon with multiple pages
npm start search -q "wireless headphones" -s amazon -p 3

# Save results as CSV
npm start search -q "running shoes" -s asos -f csv -o my_results
```

### Interactive Mode
```bash
# Start interactive session
npm start interactive
```

### Demo
```bash
# Run a quick demo
npm start demo
```

## Usage

### Command Line Interface

#### Search Command
```bash
npm start search [options]
```

**Options:**
- `-q, --query <query>` - Search query (required)
- `-s, --site <site>` - E-commerce site: `asos` or `amazon` (default: asos)
- `-p, --pages <pages>` - Number of pages to scrape (default: 1)
- `-f, --format <format>` - Output format: `json`, `csv`, or `sqlite` (default: json)
- `-o, --output <filename>` - Output filename without extension
- `--visible` - Run with visible browser window (default: headless)

**Examples:**
```bash
# Basic search
npm start search -q "women summer dress"

# Advanced search with options
npm start search -q "gaming laptop" -s amazon -p 2 -f csv -o laptops

# Visible browser for debugging
npm start search -q "men shoes" --visible
```

#### List Command
```bash
npm start list [options]
```

**Options:**
- `-f, --format <format>` - Filter by format

**Examples:**
```bash
# List all saved files
npm start list

# List only JSON files
npm start list -f json
```

#### Load Command
```bash
npm start load [options]
```

**Options:**
- `-f, --file <filename>` - Filename without extension (required)
- `-t, --format <format>` - File format (default: json)
- `-l, --limit <limit>` - Limit number of products to display (default: 10)

**Examples:**
```bash
# Load and display products
npm start load -f my_results

# Load with custom format and limit
npm start load -f laptops -t csv -l 20
```

### Programmatic Usage

```javascript
import { EcommerceScraper } from './src/EcommerceScraper.js';

const scraper = new EcommerceScraper({
  headless: true,
  timeout: 30000
});

try {
  await scraper.initialize();
  
  const products = await scraper.searchProducts('men jacket', 'asos', 2);
  
  await scraper.saveProducts(products, 'json', 'my_results');
  
  console.log(`Found ${products.length} products`);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await scraper.close();
}
```

## Output Format

### JSON Structure
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "total_products": 24,
  "products": [
    {
      "product_href": "https://www.asos.com/us/product/12345",
      "title": "Men's Puffer Jacket",
      "thumbnail": "https://images.asos-media.com/...",
      "price": "$89.99",
      "rating": "4.5 out of 5 stars"
    }
  ]
}
```

### CSV Structure
```csv
Product URL,Title,Thumbnail,Price,Rating
https://www.asos.com/us/product/12345,Men's Puffer Jacket,https://images.asos-media.com/...,$89.99,4.5 out of 5 stars
```

### SQLite Structure
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_href TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  price TEXT,
  rating TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Supported Sites

### ASOS
- **URL**: https://www.asos.com
- **Features**: Product tiles, pagination, dynamic loading
- **Selectors**: Multiple fallback selectors for robustness

### Amazon
- **URL**: https://www.amazon.com
- **Features**: Search results, sponsored content filtering, bot detection handling
- **Selectors**: Handles various Amazon layouts and product types

## Configuration

### Environment Variables
```bash
# Enable debug mode for detailed error information
export DEBUG=true

# Set custom user agent
export USER_AGENT="Mozilla/5.0 (Custom Agent)"
```

### Browser Options
```javascript
const scraper = new EcommerceScraper({
  headless: true,           // Run in headless mode
  timeout: 30000,          // Page load timeout
  userAgent: '...',        // Custom user agent
  viewport: {              // Browser viewport
    width: 1920,
    height: 1080
  }
});
```

## Error Handling

The scraper includes comprehensive error handling:

- **Timeout Errors**: Automatic retry with exponential backoff
- **Navigation Errors**: Graceful handling of failed page loads
- **Bot Detection**: Detection and handling of anti-bot measures
- **Network Errors**: Retry logic for network issues
- **Validation Errors**: Input validation with helpful error messages

### Common Issues and Solutions

1. **"No products found"**
   - Check if the search query is valid
   - Try a different site
   - Run with `--visible` flag to see what's happening

2. **"Timeout errors"**
   - Increase timeout value
   - Check internet connection
   - Try running with `--visible` flag

3. **"Bot detection"**
   - Run with `--visible` flag
   - Wait a few minutes before retrying
   - Use a different user agent

## Development

### Project Structure
```
ecommerce-scraper-agent/
├── src/
│   ├── EcommerceScraper.js    # Main scraper class
│   ├── DataStorage.js         # Data persistence
│   ├── ErrorHandler.js        # Error handling utilities
│   ├── index.js              # CLI interface
│   └── test.js               # Test suite
├── scrapers/
│   ├── ASOSScraper.js        # ASOS-specific logic
│   └── AmazonScraper.js      # Amazon-specific logic
├── data/                     # Output directory
├── package.json
└── README.md
```

### Adding New Sites

1. Create a new scraper class in `scrapers/`
2. Implement the required methods:
   - `scrapeProducts(page, query, maxPages)`
   - `waitForProducts(page)`
   - `extractProductsFromPage(page)`
   - `hasNextPage(page)`
3. Add the scraper to `EcommerceScraper.js`
4. Update CLI validation

### Running Tests
```bash
# Run the test suite
npm test

# Run with debug output
DEBUG=true npm test
```

## Legal and Ethical Considerations

- **Respect robots.txt**: Check the site's robots.txt file
- **Rate Limiting**: Don't overwhelm servers with requests
- **Terms of Service**: Ensure compliance with site terms
- **Data Usage**: Use extracted data responsibly
- **Attribution**: Give proper credit when using scraped data

## Troubleshooting

### Debug Mode
```bash
# Enable debug mode for detailed logging
DEBUG=true npm start search -q "test query"
```

### Common Commands
```bash
# Check system requirements
npm test

# List saved files
npm start list

# View help
npm start --help

# Run demo
npm start demo
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Run with debug mode enabled
3. Check the error messages and suggestions
4. Create an issue with detailed information

---

**Note**: This tool is for educational and research purposes. Always respect website terms of service and implement appropriate rate limiting.

