const AirbnbScraper = require('./scraper');
const Database = require('./database');
const NotificationService = require('./notifications');
const config = require('./config');

class AirbnbMonitor {
  constructor() {
    this.scraper = new AirbnbScraper();
    this.database = new Database();
    this.notifications = new NotificationService();
    this.isRunning = false;
  }

  async run() {
    if (this.isRunning) {
      console.log('Monitor is already running, skipping this cycle...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    console.log(`\n🤖 Starting Airbnb monitor at ${startTime.toLocaleString()}`);
    
    let stats = {
      listingsFound: 0,
      newListings: 0,
      success: false,
      errorMessage: null
    };

    try {
      // Initialize scraper
      await this.scraper.init();
      
      // Scrape listings
      const listings = await this.scraper.scrapeListings();
      stats.listingsFound = listings.length;

      if (listings.length === 0) {
        console.log('⚠️  No listings found. This might indicate a problem with the scraper.');
        stats.errorMessage = 'No listings found';
      } else {
        // Save listings to database
        const newListings = [];
        
        for (const listing of listings) {
          try {
            await this.database.saveListing(listing);
            
            // Check if this is a new listing
            const newListingsFromDb = await this.database.getNewListings();
            const isNewListing = newListingsFromDb.some(dbListing => dbListing.id === listing.id);
            
            if (isNewListing) {
              newListings.push(listing);
            }
          } catch (error) {
            console.error(`Error saving listing ${listing.id}:`, error.message);
          }
        }

        stats.newListings = newListings.length;
        stats.success = true;

        if (newListings.length > 0) {
          console.log(`🎉 Found ${newListings.length} new listing${newListings.length > 1 ? 's' : ''}!`);
          
          // Send notifications
          await this.notifications.sendNewListingAlert(newListings);
          
          // Mark as notified
          const listingIds = newListings.map(listing => listing.id);
          await this.database.markAsNotified(listingIds);
        } else {
          console.log('📊 No new listings found this time.');
        }

        // Log some stats
        const dbStats = await this.database.getStats();
        console.log(`📈 Database stats: ${dbStats.total_listings} total listings, ${dbStats.new_listings} new, ${dbStats.notified_listings} notified`);
      }

    } catch (error) {
      console.error('❌ Error during monitoring run:', error.message);
      stats.success = false;
      stats.errorMessage = error.message;
    } finally {
      // Clean up
      await this.scraper.close();
      
      // Log the run
      await this.database.logRun(stats);
      
      const endTime = new Date();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`✅ Monitor run completed in ${duration}s\n`);
      
      this.isRunning = false;
    }

    return stats;
  }

  async testConnection() {
    console.log('🧪 Testing Airbnb monitor components...\n');

    // Test scraper
    console.log('1. Testing scraper...');
    try {
      await this.scraper.init();
      console.log('   ✅ Scraper initialized successfully');
      
      const url = config.buildSearchUrl();
      console.log(`   🔗 Search URL: ${url}`);
      
      await this.scraper.close();
    } catch (error) {
      console.log(`   ❌ Scraper test failed: ${error.message}`);
    }

    // Test database
    console.log('\n2. Testing database...');
    try {
      const stats = await this.database.getStats();
      console.log(`   ✅ Database connected. Stats: ${stats.total_listings} total listings`);
    } catch (error) {
      console.log(`   ❌ Database test failed: ${error.message}`);
    }

    // Test notifications
    console.log('\n3. Testing notifications...');
    try {
      await this.notifications.testEmail();
      console.log('   ✅ Notification test completed (check your email)');
    } catch (error) {
      console.log(`   ❌ Notification test failed: ${error.message}`);
    }

    console.log('\n🎯 Test completed. If all components passed, you\'re ready to start monitoring!');
  }

  async getStatus() {
    try {
      const stats = await this.database.getStats();
      return {
        isRunning: this.isRunning,
        searchCriteria: config.search,
        monitorSettings: config.monitor,
        databaseStats: stats,
        searchUrl: config.buildSearchUrl()
      };
    } catch (error) {
      console.error('Error getting status:', error.message);
      return null;
    }
  }

  async shutdown() {
    console.log('🛑 Shutting down Airbnb monitor...');
    
    if (this.scraper) {
      await this.scraper.close();
    }
    
    if (this.database) {
      this.database.close();
    }
    
    console.log('✅ Monitor shutdown complete');
  }

  // Helper method to reset new listings flag (for testing)
  async resetNewListingsFlag() {
    return new Promise((resolve, reject) => {
      this.database.db.run('UPDATE listings SET is_new = 0, notified = 0', [], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Helper method to get recent listings
  async getRecentListings(limit = 10) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM listings ORDER BY last_seen DESC LIMIT ?';
      
      this.database.db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = AirbnbMonitor; 