import { IntelligentPromptProcessor } from './src/IntelligentPromptProcessor.js';
import chalk from 'chalk';

async function demonstrateAIWorkflow() {
  console.log(chalk.blue('🤖 AI-Enhanced E-commerce Workflow Demo'));
  console.log(chalk.gray('This demonstrates how AI processes your prompt for optimal search results'));
  console.log('');

  const processor = new IntelligentPromptProcessor();
  
  // Test prompts
  const testPrompts = [
    "I want a red polo shirt with black dress pants white nike socks and jordan 4 thunders",
    "I need a blue hoodie and white sneakers",
    "Looking for a black jacket and gray jeans"
  ];

  for (let i = 0; i < testPrompts.length; i++) {
    const prompt = testPrompts[i];
    
    console.log(chalk.cyan(`📝 Test ${i + 1}:`));
    console.log(chalk.white(`"${prompt}"`));
    console.log('');

    try {
      const searchQueries = await processor.processPrompt(prompt);
      
      console.log(chalk.green('✅ AI Processing Complete!'));
      console.log(chalk.cyan('🔍 Optimized Search Queries:'));
      searchQueries.forEach((query, index) => {
        console.log(chalk.white(`   ${index + 1}. "${query}"`));
      });
      console.log('');
      
      console.log(chalk.gray('Next step: These queries would be fed to Puppeteer for actual scraping'));
      console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log('');
      
    } catch (error) {
      console.log(chalk.red('❌ AI processing failed:'), error.message);
      console.log('');
    }
  }

  console.log(chalk.blue('🎯 Workflow Summary:'));
  console.log(chalk.gray('1. User provides natural language prompt'));
  console.log(chalk.gray('2. AI analyzes and breaks down into optimized search queries'));
  console.log(chalk.gray('3. Each query is executed with Puppeteer on e-commerce sites'));
  console.log(chalk.gray('4. Results are combined into a complete outfit recommendation'));
  console.log(chalk.gray('5. Data is saved in structured format (JSON/CSV/SQLite)'));
}

// Run the demo
demonstrateAIWorkflow().catch(console.error);
