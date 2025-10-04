import chalk from 'chalk';
import os from 'os';

export class ErrorHandler {
  static handle(error, context = '') {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      context,
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    };

    // Log error details
    console.error(chalk.red(`❌ Error [${context}]:`), error.message);
    
    if (process.env.DEBUG) {
      console.error(chalk.gray('Stack trace:'), error.stack);
    }

    // Handle specific error types
    switch (error.constructor.name) {
      case 'TimeoutError':
        return this.handleTimeoutError(error, context);
      case 'NavigationError':
        return this.handleNavigationError(error, context);
      case 'NetworkError':
        return this.handleNetworkError(error, context);
      case 'BotDetectionError':
        return this.handleBotDetectionError(error, context);
      default:
        return this.handleGenericError(error, context);
    }
  }

  static handleTimeoutError(error, context) {
    console.log(chalk.yellow('⏱️  Timeout occurred. This might be due to:'));
    console.log(chalk.gray('  - Slow network connection'));
    console.log(chalk.gray('  - Site taking too long to load'));
    console.log(chalk.gray('  - Bot detection mechanisms'));
    console.log(chalk.blue('💡 Try increasing the timeout or running with --visible flag'));
    return { retry: true, delay: 5000 };
  }

  static handleNavigationError(error, context) {
    console.log(chalk.yellow('🧭 Navigation failed. This might be due to:'));
    console.log(chalk.gray('  - Invalid URL or site structure changes'));
    console.log(chalk.gray('  - Site blocking automated requests'));
    console.log(chalk.gray('  - Network connectivity issues'));
    console.log(chalk.blue('💡 Try using a different site or check your internet connection'));
    return { retry: false, delay: 0 };
  }

  static handleNetworkError(error, context) {
    console.log(chalk.yellow('🌐 Network error occurred. This might be due to:'));
    console.log(chalk.gray('  - Internet connection issues'));
    console.log(chalk.gray('  - Site server problems'));
    console.log(chalk.gray('  - Firewall or proxy blocking requests'));
    console.log(chalk.blue('💡 Check your internet connection and try again'));
    return { retry: true, delay: 3000 };
  }

  static handleBotDetectionError(error, context) {
    console.log(chalk.yellow('🤖 Bot detection triggered. This might be due to:'));
    console.log(chalk.gray('  - Site detecting automated browsing'));
    console.log(chalk.gray('  - Rate limiting or IP blocking'));
    console.log(chalk.gray('  - Captcha requirements'));
    console.log(chalk.blue('💡 Try running with --visible flag or wait before retrying'));
    return { retry: true, delay: 10000 };
  }

  static handleGenericError(error, context) {
    console.log(chalk.yellow('⚠️  An unexpected error occurred'));
    console.log(chalk.blue('💡 Check the error message above for details'));
    return { retry: false, delay: 0 };
  }

  // Utility method to create custom errors
  static createError(type, message, context = '') {
    const error = new Error(message);
    error.type = type;
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  }

  // Method to validate search parameters
  static validateSearchParams(query, site, pages) {
    const errors = [];

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      errors.push('Search query is required and must be a non-empty string');
    }

    if (!site || typeof site !== 'string') {
      errors.push('Site parameter is required');
    } else if (!['asos', 'amazon'].includes(site.toLowerCase())) {
      errors.push('Site must be either "asos" or "amazon"');
    }

    if (pages && (isNaN(pages) || pages < 1 || pages > 10)) {
      errors.push('Pages must be a number between 1 and 10');
    }

    if (errors.length > 0) {
      const error = this.createError('ValidationError', errors.join('; '), 'validateSearchParams');
      throw error;
    }

    return true;
  }

  // Method to validate file operations
  static validateFileParams(filename, format) {
    const errors = [];

    if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
      errors.push('Filename is required and must be a non-empty string');
    }

    if (!format || typeof format !== 'string') {
      errors.push('Format parameter is required');
    } else if (!['json', 'csv', 'sqlite', 'db'].includes(format.toLowerCase())) {
      errors.push('Format must be one of: json, csv, sqlite, db');
    }

    // Check for invalid filename characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      errors.push('Filename contains invalid characters');
    }

    if (errors.length > 0) {
      const error = this.createError('ValidationError', errors.join('; '), 'validateFileParams');
      throw error;
    }

    return true;
  }

  // Method to handle retry logic with exponential backoff
  static async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorInfo = this.handle(error, `Attempt ${attempt}/${maxRetries}`);
        
        if (!errorInfo.retry || attempt === maxRetries) {
          break;
        }
        
        const delay = errorInfo.delay || baseDelay * Math.pow(2, attempt - 1);
        console.log(chalk.yellow(`⏳ Retrying in ${delay}ms...`));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Method to check system requirements
  static checkSystemRequirements() {
    const issues = [];

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 16) {
      issues.push(`Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 16 or higher.`);
    }

    // Check available memory
    const totalMemory = process.memoryUsage().heapTotal;
    const freeMemory = os.freemem();
    if (freeMemory < 100 * 1024 * 1024) { // 100MB
      issues.push('Low system memory detected. Puppeteer may not work properly.');
    }

    if (issues.length > 0) {
      console.log(chalk.yellow('⚠️  System requirement issues detected:'));
      issues.forEach(issue => console.log(chalk.gray(`  - ${issue}`)));
      console.log('');
    }

    return issues.length === 0;
  }

  // Method to provide helpful suggestions based on error context
  static getSuggestions(error, context) {
    const suggestions = [];

    if (error.message.includes('timeout')) {
      suggestions.push('Try increasing the timeout value');
      suggestions.push('Check your internet connection');
      suggestions.push('Run with --visible flag to see what\'s happening');
    }

    if (error.message.includes('navigation')) {
      suggestions.push('Verify the site URL is correct');
      suggestions.push('Check if the site is accessible');
      suggestions.push('Try a different e-commerce site');
    }

    if (error.message.includes('bot') || error.message.includes('captcha')) {
      suggestions.push('Run with --visible flag');
      suggestions.push('Wait a few minutes before retrying');
      suggestions.push('Consider using a different user agent');
    }

    if (error.message.includes('network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify firewall settings');
      suggestions.push('Try using a VPN if the site is blocked');
    }

    if (suggestions.length > 0) {
      console.log(chalk.blue('💡 Suggestions:'));
      suggestions.forEach(suggestion => console.log(chalk.gray(`  - ${suggestion}`)));
    }

    return suggestions;
  }
}

