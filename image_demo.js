#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import { ImageDownloader } from './src/ImageDownloader.js';
import { DataStorage } from './src/DataStorage.js';

async function runImageDemo() {
  console.log(chalk.blue('🖼️  E-commerce Image Downloader Demo'));
  console.log(chalk.gray('This demo shows how to download product images from extracted URLs'));
  console.log('');

  // Create sample products with real image URLs
  const sampleProducts = [
    {
      product_href: "https://www.amazon.com/dp/B08N5WRWNW",
      title: "Sony WH-1000XM4 Wireless Premium Noise Canceling Overhead Headphones",
      thumbnail: "https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SX679_.jpg",
      price: "$278.00",
      rating: "4.6 out of 5 stars"
    },
    {
      product_href: "https://www.amazon.com/dp/B08N5WRWNW",
      title: "Apple AirPods Pro (2nd Generation)",
      thumbnail: "https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SX679_.jpg",
      price: "$249.00",
      rating: "4.5 out of 5 stars"
    },
    {
      product_href: "https://www.asos.com/us/product/12345",
      title: "Men's Classic Denim Jacket",
      thumbnail: "https://images.asos-media.com/products/asos-design-mens-classic-denim-jacket-in-blue/12345-1-blue",
      price: "$89.99",
      rating: "4.3 out of 5 stars"
    }
  ];

  console.log(chalk.cyan('📦 Sample Products with Image URLs:'));
  sampleProducts.forEach((product, index) => {
    console.log(chalk.white(`${index + 1}. ${product.title}`));
    console.log(chalk.gray(`   Image: ${product.thumbnail}`));
    console.log('');
  });

  // Initialize image downloader
  const imageDownloader = new ImageDownloader({
    timeout: 15000,
    maxConcurrent: 3,
    retries: 2
  });

  console.log(chalk.cyan('🔄 Downloading Product Images...'));
  console.log('');

  try {
    // Download images
    const downloadedImages = await imageDownloader.downloadProductImages(sampleProducts, {
      maxImages: 3,
      createSubdirs: true
    });

    console.log('');
    console.log(chalk.green('✅ Image Download Results:'));
    downloadedImages.forEach((image, index) => {
      console.log(chalk.white(`${index + 1}. ${image.product_title}`));
      console.log(chalk.gray(`   Local Path: ${image.local_path}`));
      console.log(chalk.gray(`   Original URL: ${image.image_url}`));
      console.log('');
    });

    // Show file system info
    console.log(chalk.cyan('📁 Downloaded Images Directory:'));
    const imageFiles = await imageDownloader.listDownloadedImages();
    if (imageFiles.length > 0) {
      imageFiles.forEach(file => {
        console.log(chalk.gray(`  ${file}`));
      });
    } else {
      console.log(chalk.yellow('  No images found'));
    }

    // Save download results to JSON
    const storage = new DataStorage();
    const resultsPath = await storage.save(downloadedImages, 'json', 'image_download_results');
    console.log('');
    console.log(chalk.green(`📄 Download results saved to: ${resultsPath}`));

  } catch (error) {
    console.error(chalk.red('❌ Image download failed:'), error.message);
  }

  console.log('');
  console.log(chalk.cyan('🛠️  Image Downloader Features:'));
  console.log(chalk.green('✅ Downloads images from product thumbnail URLs'));
  console.log(chalk.green('✅ Handles multiple image formats (JPG, PNG, WebP, etc.)'));
  console.log(chalk.green('✅ Creates organized directory structure'));
  console.log(chalk.green('✅ Concurrent downloads with rate limiting'));
  console.log(chalk.green('✅ Error handling and retry logic'));
  console.log(chalk.green('✅ Duplicate detection (skips existing files)'));
  console.log(chalk.green('✅ Clean filename generation'));
  console.log(chalk.green('✅ Progress tracking and reporting'));
  console.log('');

  console.log(chalk.cyan('💻 CLI Usage with Image Download:'));
  console.log(chalk.gray('# Search and download images'));
  console.log(chalk.white('node src/index.js search -q "wireless headphones" -s amazon --download-images'));
  console.log('');
  console.log(chalk.gray('# Download with custom limit'));
  console.log(chalk.white('node src/index.js search -q "men jacket" -s asos --download-images --max-images 5'));
  console.log('');

  console.log(chalk.cyan('🔧 Programmatic Usage:'));
  console.log(chalk.gray('```javascript'));
  console.log(chalk.white('import { EcommerceScraper } from "./src/EcommerceScraper.js";'));
  console.log(chalk.white(''));
  console.log(chalk.white('const scraper = new EcommerceScraper();'));
  console.log(chalk.white('await scraper.initialize();'));
  console.log(chalk.white('const products = await scraper.searchProducts("headphones", "amazon");'));
  console.log(chalk.white('const images = await scraper.downloadProductImages(products, {'));
  console.log(chalk.white('  maxImages: 10,'));
  console.log(chalk.white('  createSubdirs: true'));
  console.log(chalk.white('});'));
  console.log(chalk.gray('```'));
  console.log('');

  console.log(chalk.blue('🎉 Image Download Demo Completed!'));
  console.log(chalk.yellow('💡 The agent can now:'));
  console.log(chalk.gray('  ✓ Extract product thumbnail URLs from e-commerce sites'));
  console.log(chalk.gray('  ✓ Download and save images locally'));
  console.log(chalk.gray('  ✓ Organize images in structured directories'));
  console.log(chalk.gray('  ✓ Handle various image formats and sizes'));
  console.log(chalk.gray('  ✓ Provide download progress and error reporting'));
  console.log('');
  console.log(chalk.green('🚀 Complete e-commerce scraping with image extraction is now available!'));
}

// Run the demo
runImageDemo().catch(error => {
  console.error(chalk.red('Image demo failed:'), error);
  process.exit(1);
});
