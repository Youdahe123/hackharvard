import puppeteer from 'puppeteer';
import chalk from 'chalk';

async function testPuppeteer() {
  console.log(chalk.blue('🧪 Testing Puppeteer installation...'));
  
  try {
    console.log(chalk.gray('Launching browser...'));
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      timeout: 30000
    });
    
    console.log(chalk.green('✓ Browser launched successfully'));
    
    const page = await browser.newPage();
    console.log(chalk.green('✓ Page created'));
    
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log(chalk.green('✓ Navigation successful'));
    
    const title = await page.title();
    console.log(chalk.green(`✓ Page title: ${title}`));
    
    await browser.close();
    console.log(chalk.green('✓ Browser closed'));
    
    console.log(chalk.blue('🎉 Puppeteer test successful!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Puppeteer test failed:'), error.message);
    console.error(chalk.gray('Stack trace:'), error.stack);
  }
}

testPuppeteer();
