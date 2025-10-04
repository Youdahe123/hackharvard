import { AIEnhancedScraper } from './src/AIEnhancedScraper.js';
import chalk from 'chalk';

async function testAIWorkflow() {
  console.log(chalk.blue('🤖 Testing AI-Enhanced E-commerce Workflow'));
  console.log(chalk.gray('Workflow: User Prompt → AI Processing → Optimized Search → Puppeteer Scraping'));
  console.log('');

  const scraper = new AIEnhancedScraper();
  
  // Test with the complex multi-product prompt
  const testPrompt = "I want a red polo shirt with black dress pants white nike socks and jordan 4 thunders";
  
  console.log(chalk.cyan('📝 Test Prompt:'));
  console.log(chalk.white(`"${testPrompt}"`));
  console.log('');

  try {
    const result = await scraper.processOutfitRequest(testPrompt, 'amazon');
    
    if (result.success) {
      console.log(chalk.green('✅ AI-Enhanced Workflow Test Successful!'));
      console.log('');
      
      // Show the essential data structure
      const essentialData = scraper.getEssentialData(result.products);
      console.log(chalk.cyan('📋 Essential Data (JSON format):'));
      console.log(JSON.stringify(essentialData, null, 2));
      console.log('');
      
      // Show photo URLs
      const photoUrls = scraper.getPhotoUrls(result.products);
      console.log(chalk.cyan('📸 Photo URLs:'));
      photoUrls.forEach((item, index) => {
        console.log(chalk.white(`${index + 1}. ${item.name}`));
        console.log(chalk.gray(`   Thumbnail: ${item.thumbnail}`));
        console.log(chalk.gray(`   Full Res: ${item.fullResolution}`));
        console.log('');
      });
      
    } else {
      console.log(chalk.red('❌ Test failed:'), result.error);
    }
  } catch (error) {
    console.error(chalk.red('❌ Test error:'), error.message);
  }
}

// Run the test
testAIWorkflow().catch(console.error);
