import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ImageDownloader {
  constructor(options = {}) {
    this.imagesDir = path.join(__dirname, '../data/images');
    this.options = {
      timeout: options.timeout || 10000,
      maxConcurrent: options.maxConcurrent || 5,
      retries: options.retries || 3,
      ...options
    };
    this.ensureImagesDirectory();
  }

  async ensureImagesDirectory() {
    try {
      await fs.access(this.imagesDir);
    } catch {
      await fs.mkdir(this.imagesDir, { recursive: true });
    }
  }

  async downloadProductImages(products, options = {}) {
    const {
      downloadAll = false,
      maxImages = 10,
      createSubdirs = true
    } = options;

    const imagesToDownload = products
      .filter(product => product.thumbnail && product.thumbnail.trim())
      .slice(0, downloadAll ? products.length : maxImages);

    if (imagesToDownload.length === 0) {
      console.log(chalk.yellow('⚠ No images to download'));
      return [];
    }

    const spinner = ora(`Downloading ${imagesToDownload.length} product images...`).start();
    const downloadedImages = [];
    const errors = [];

    // Process images in batches to avoid overwhelming the server
    const batchSize = this.options.maxConcurrent;
    for (let i = 0; i < imagesToDownload.length; i += batchSize) {
      const batch = imagesToDownload.slice(i, i + batchSize);
      const batchPromises = batch.map(async (product, index) => {
        try {
          const imagePath = await this.downloadImage(
            product.thumbnail,
            product.title || `product_${i + index}`,
            createSubdirs
          );
          
          if (imagePath) {
            downloadedImages.push({
              product_title: product.title,
              product_url: product.product_href,
              image_url: product.thumbnail,
              local_path: imagePath
            });
          }
        } catch (error) {
          errors.push({
            product_title: product.title,
            image_url: product.thumbnail,
            error: error.message
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Update progress
      const progress = Math.min(i + batchSize, imagesToDownload.length);
      spinner.text = `Downloaded ${progress}/${imagesToDownload.length} images...`;
    }

    spinner.succeed(`Downloaded ${downloadedImages.length} images successfully`);

    if (errors.length > 0) {
      console.log(chalk.yellow(`⚠ ${errors.length} images failed to download`));
      if (process.env.DEBUG) {
        errors.forEach(error => {
          console.log(chalk.gray(`  ${error.product_title}: ${error.error}`));
        });
      }
    }

    return downloadedImages;
  }

  async downloadImage(imageUrl, productTitle, createSubdirs = true) {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw new Error('Invalid image URL');
    }

    // Clean filename from product title
    const cleanTitle = this.cleanFilename(productTitle);
    const url = new URL(imageUrl);
    const extension = this.getImageExtension(url.pathname) || '.jpg';
    const filename = `${cleanTitle}${extension}`;

    // Create subdirectory if requested
    const targetDir = createSubdirs 
      ? path.join(this.imagesDir, cleanTitle.substring(0, 10))
      : this.imagesDir;

    try {
      await fs.access(targetDir);
    } catch {
      await fs.mkdir(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);

    // Check if file already exists
    try {
      await fs.access(filePath);
      return filePath; // File already exists
    } catch {
      // File doesn't exist, proceed with download
    }

    return new Promise((resolve, reject) => {
      const client = imageUrl.startsWith('https:') ? https : http;
      
      const request = client.get(imageUrl, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
          reject(new Error(`Invalid content type: ${contentType}`));
          return;
        }

        const fileStream = fsSync.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filePath);
        });

        fileStream.on('error', (error) => {
          fs.unlink(filePath).catch(() => {}); // Clean up on error
          reject(error);
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  cleanFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50) // Limit length
      .toLowerCase();
  }

  getImageExtension(pathname) {
    const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
    return match ? `.${match[1].toLowerCase()}` : null;
  }

  async getImageInfo(imagePath) {
    try {
      const stats = await fs.stat(imagePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch {
      return null;
    }
  }

  async listDownloadedImages() {
    try {
      const files = await fs.readdir(this.imagesDir, { recursive: true });
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file)
      );
      return imageFiles;
    } catch {
      return [];
    }
  }

  async deleteImage(imagePath) {
    try {
      await fs.unlink(imagePath);
      return true;
    } catch {
      return false;
    }
  }

  async cleanupEmptyDirectories() {
    try {
      const dirs = await fs.readdir(this.imagesDir, { withFileTypes: true });
      
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          const dirPath = path.join(this.imagesDir, dir.name);
          const files = await fs.readdir(dirPath);
          
          if (files.length === 0) {
            await fs.rmdir(dirPath);
          }
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error.message);
    }
  }
}
