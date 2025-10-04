import { EcommerceScraper } from './EcommerceScraper.js';
import { ErrorHandler } from './ErrorHandler.js';
import chalk from 'chalk';

async function runTests() {
  console.log(chalk.blue('🧪 Running E-commerce Scraper Tests'));
  console.log('');

  // Check system requirements
  console.log(chalk.cyan('1. Checking system requirements...'));
  const systemOk = ErrorHandler.checkSystemRequirements();
  if (systemOk) {
    console.log(chalk.green('✅ System requirements met'));
  }
  console.log('');

  // Test 1: Basic initialization
  console.log(chalk.cyan('2. Testing browser initialization...'));
  const scraper = new EcommerceScraper({ headless: true });
  
  try {
    await scraper.initialize();
    console.log(chalk.green('✅ Browser initialized successfully'));
  } catch (error) {
    console.log(chalk.red('❌ Browser initialization failed:'), error.message);
    return;
  }
  console.log('');

  // Test 2: Parameter validation
  console.log(chalk.cyan('3. Testing parameter validation...'));
  try {
    ErrorHandler.validateSearchParams('test query', 'asos', 1);
    console.log(chalk.green('✅ Parameter validation passed'));
  } catch (error) {
    console.log(chalk.red('❌ Parameter validation failed:'), error.message);
  }
  console.log('');

  // Test 3: ASOS search (limited to 1 page)
  console.log(chalk.cyan('4. Testing ASOS product search...'));
  try {
    const products = await scraper.searchProducts('men jacket', 'asos', 1);
    console.log(chalk.green(`✅ ASOS search completed - found ${products.length} products`));
    
    if (products.length > 0) {
      console.log(chalk.gray('Sample product:'));
      console.log(chalk.gray(`  Title: ${products[0].title}`));
      console.log(chalk.gray(`  URL: ${products[0].product_href}`));
    }
  } catch (error) {
    console.log(chalk.red('❌ ASOS search failed:'), error.message);
    ErrorHandler.getSuggestions(error, 'ASOS search');
  }
  console.log('');

  // Test 4: Data storage
  console.log(chalk.cyan('5. Testing data storage...'));
  try {
    const testProducts = [
      {
        product_href: 'https://example.com/product1',
        title: 'Test Product 1',
        thumbnail: 'https://example.com/image1.jpg'
      },
      {
        product_href: 'https://example.com/product2',
        title: 'Test Product 2',
        thumbnail: 'https://example.com/image2.jpg'
      }
    ];

    const jsonPath = await scraper.saveProducts(testProducts, 'json', 'test_products');
    console.log(chalk.green(`✅ JSON storage test passed - saved to ${jsonPath}`));

    const csvPath = await scraper.saveProducts(testProducts, 'csv', 'test_products');
    console.log(chalk.green(`✅ CSV storage test passed - saved to ${csvPath}`));

  } catch (error) {
    console.log(chalk.red('❌ Data storage test failed:'), error.message);
  }
  console.log('');

  // Test 5: Error handling
  console.log(chalk.cyan('6. Testing error handling...'));
  try {
    await scraper.searchProducts('', 'invalid_site', 0);
  } catch (error) {
    const errorInfo = ErrorHandler.handle(error, 'Error handling test');
    console.log(chalk.green('✅ Error handling test passed'));
  }
  console.log('');

  // Cleanup
  await scraper.close();
  console.log(chalk.blue('🏁 Tests completed'));
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error(chalk.red('Test suite failed:'), error);
    process.exit(1);
  });
}

export { runTests };

