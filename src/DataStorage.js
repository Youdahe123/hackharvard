import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DataStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async save(products, format = 'json', filename = null) {
    if (!products || products.length === 0) {
      throw new Error('No products to save');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `products_${timestamp}`;
    const finalFilename = filename || defaultFilename;

    switch (format.toLowerCase()) {
      case 'json':
        return await this.saveAsJSON(products, finalFilename);
      case 'csv':
        return await this.saveAsCSV(products, finalFilename);
      case 'sqlite':
      case 'db':
        return await this.saveAsSQLite(products, finalFilename);
      default:
        throw new Error(`Unsupported format: ${format}. Supported formats: json, csv, sqlite`);
    }
  }

  async saveAsJSON(products, filename) {
    const filepath = path.join(this.dataDir, `${filename}.json`);
    
    const data = {
      timestamp: new Date().toISOString(),
      total_products: products.length,
      products: products
    };

    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    return filepath;
  }

  async saveAsCSV(products, filename) {
    const filepath = path.join(this.dataDir, `${filename}.csv`);
    
    // Prepare CSV data
    const csvData = products.map(product => ({
      product_href: product.product_href || '',
      title: product.title || '',
      thumbnail: product.thumbnail || '',
      price: product.price || '',
      rating: product.rating || ''
    }));

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'product_href', title: 'Product URL' },
        { id: 'title', title: 'Title' },
        { id: 'thumbnail', title: 'Thumbnail' },
        { id: 'price', title: 'Price' },
        { id: 'rating', title: 'Rating' }
      ]
    });

    await csvWriter.writeRecords(csvData);
    return filepath;
  }

  async saveAsSQLite(products, filename) {
    const filepath = path.join(this.dataDir, `${filename}.db`);
    
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(filepath);

      db.serialize(() => {
        // Create products table
        db.run(`
          CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_href TEXT NOT NULL,
            title TEXT NOT NULL,
            thumbnail TEXT,
            price TEXT,
            rating TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create search sessions table
        db.run(`
          CREATE TABLE IF NOT EXISTS search_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            site TEXT NOT NULL,
            total_products INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Insert search session
        const stmt = db.prepare(`
          INSERT INTO search_sessions (query, site, total_products)
          VALUES (?, ?, ?)
        `);

        // For now, we'll use placeholder values since we don't have the search context
        stmt.run('unknown', 'unknown', products.length);
        stmt.finalize();

        // Insert products
        const productStmt = db.prepare(`
          INSERT INTO products (product_href, title, thumbnail, price, rating)
          VALUES (?, ?, ?, ?, ?)
        `);

        products.forEach(product => {
          productStmt.run(
            product.product_href || '',
            product.title || '',
            product.thumbnail || '',
            product.price || '',
            product.rating || ''
          );
        });

        productStmt.finalize();
      });

      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(filepath);
        }
      });
    });
  }

  async load(filename, format = 'json') {
    const filepath = path.join(this.dataDir, `${filename}.${format}`);
    
    try {
      await fs.access(filepath);
    } catch {
      throw new Error(`File not found: ${filepath}`);
    }

    switch (format.toLowerCase()) {
      case 'json':
        return await this.loadFromJSON(filepath);
      case 'csv':
        return await this.loadFromCSV(filepath);
      case 'sqlite':
      case 'db':
        return await this.loadFromSQLite(filepath);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  async loadFromJSON(filepath) {
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  }

  async loadFromCSV(filepath) {
    // Simple CSV parser for basic use cases
    const data = await fs.readFile(filepath, 'utf8');
    const lines = data.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index] ? values[index].trim() : '';
      });
      return obj;
    });
  }

  async loadFromSQLite(filepath) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(filepath);
      const products = [];

      db.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      });
    });
  }

  async listFiles(format = null) {
    try {
      const files = await fs.readdir(this.dataDir);
      
      if (format) {
        const extension = format === 'sqlite' ? '.db' : `.${format}`;
        return files.filter(file => file.endsWith(extension));
      }
      
      return files;
    } catch {
      return [];
    }
  }

  async deleteFile(filename, format = 'json') {
    const filepath = path.join(this.dataDir, `${filename}.${format}`);
    
    try {
      await fs.unlink(filepath);
      return true;
    } catch {
      return false;
    }
  }

  // Utility method to get file stats
  async getFileStats(filename, format = 'json') {
    const filepath = path.join(this.dataDir, `${filename}.${format}`);
    
    try {
      const stats = await fs.stat(filepath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch {
      return null;
    }
  }
}

