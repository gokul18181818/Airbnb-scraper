const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('./config');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    // Ensure data directory exists
    const dataDir = path.dirname(config.database.path);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database
    this.db = new sqlite3.Database(config.database.path, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const createListingsTable = `
      CREATE TABLE IF NOT EXISTS listings (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT,
        price TEXT,
        price_numeric INTEGER DEFAULT 0,
        bedrooms INTEGER,
        bathrooms TEXT,
        guests INTEGER,
        image_url TEXT,
        host_name TEXT,
        rating REAL,
        review_count INTEGER,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_new BOOLEAN DEFAULT 1,
        notified BOOLEAN DEFAULT 0
      )
    `;

    const createRunsTable = `
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        listings_found INTEGER,
        new_listings INTEGER,
        success BOOLEAN,
        error_message TEXT
      )
    `;

    this.db.run(createListingsTable, (err) => {
      if (err) {
        console.error('Error creating listings table:', err.message);
      }
    });

    this.db.run(createRunsTable, (err) => {
      if (err) {
        console.error('Error creating runs table:', err.message);
      }
    });
  }

  async saveListing(listing) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO listings 
        (id, url, title, price, price_numeric, bedrooms, bathrooms, guests, image_url, host_name, rating, review_count, last_seen, is_new)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 
          CASE WHEN EXISTS(SELECT 1 FROM listings WHERE id = ?) THEN 0 ELSE 1 END)
      `;
      
      this.db.run(sql, [
        listing.id, listing.url, listing.title, listing.price, 
        listing.priceNumeric || 0, listing.bedrooms, listing.bathrooms, listing.guests, 
        listing.imageUrl, listing.hostName, listing.rating, 
        listing.reviewCount, listing.id
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async getNewListings() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM listings WHERE is_new = 1 AND notified = 0 ORDER BY first_seen DESC';
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async markAsNotified(listingIds) {
    if (!Array.isArray(listingIds) || listingIds.length === 0) return;
    
    return new Promise((resolve, reject) => {
      const placeholders = listingIds.map(() => '?').join(',');
      const sql = `UPDATE listings SET notified = 1 WHERE id IN (${placeholders})`;
      
      this.db.run(sql, listingIds, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  async logRun(stats) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO runs (listings_found, new_listings, success, error_message)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(sql, [
        stats.listingsFound, 
        stats.newListings, 
        stats.success, 
        stats.errorMessage
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async getStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_listings,
          COUNT(CASE WHEN is_new = 1 THEN 1 END) as new_listings,
          COUNT(CASE WHEN notified = 1 THEN 1 END) as notified_listings,
          MAX(last_seen) as last_run
        FROM listings
      `;
      
      this.db.get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = Database; 