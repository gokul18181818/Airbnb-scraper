#!/usr/bin/env node

const { CronJob } = require('cron');
const AirbnbMonitor = require('./monitor');
const config = require('./config');

class AirbnbMonitorApp {
  constructor() {
    this.monitor = new AirbnbMonitor();
    this.cronJob = null;
    this.isScheduled = false;
  }

  async start() {
    console.log('🏠 Airbnb Listing Monitor');
    console.log('========================\n');

    // Display configuration
    this.displayConfig();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'test':
        await this.test();
        break;
      case 'run-once':
        await this.runOnce();
        break;
      case 'start':
        await this.startScheduled();
        break;
      case 'status':
        await this.showStatus();
        break;
      default:
        this.showHelp();
        break;
    }
  }

  displayConfig() {
    console.log('📋 Current Configuration:');
    console.log(`   Location: ${config.search.location}`);
    console.log(`   Check-in: ${config.search.checkin}`);
    console.log(`   Check-out: ${config.search.checkout}`);
    console.log(`   Guests: ${config.search.guests}`);
    console.log(`   Min Bedrooms: ${config.search.minBedrooms}`);
    console.log(`   Max Price: $${config.search.maxPrice}`);
    console.log(`   Room Type: ${config.search.roomType}`);
    console.log(`   Monitor Interval: ${config.monitor.intervalMinutes} minutes`);
    console.log(`   Notifications: ${config.monitor.enableNotifications ? 'Enabled' : 'Disabled'}`);
    console.log(`   Headless Mode: ${config.monitor.headless}\n`);
  }

  async test() {
    console.log('🧪 Testing all components...\n');
    await this.monitor.testConnection();
    process.exit(0);
  }

  async runOnce() {
    console.log('🔍 Running monitor once...\n');
    await this.monitor.run();
    process.exit(0);
  }

  async startScheduled() {
    console.log(`⏰ Starting scheduled monitoring every ${config.monitor.intervalMinutes} minutes...\n`);
    
    // Run once immediately
    await this.monitor.run();

    // Set up cron job
    const cronExpression = `*/${config.monitor.intervalMinutes} * * * *`;
    
    this.cronJob = new CronJob(cronExpression, async () => {
      await this.monitor.run();
    }, null, true, 'America/New_York');

    this.isScheduled = true;
    console.log(`📅 Monitor scheduled with cron expression: ${cronExpression}`);
    console.log('🔄 Monitor is now running. Press Ctrl+C to stop.\n');

    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT. Stopping monitor...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM. Stopping monitor...');
      await this.stop();
      process.exit(0);
    });

    // Keep process alive
    setInterval(() => {
      // Just to keep the process running
    }, 60000);
  }

  async showStatus() {
    console.log('📊 Monitor Status:\n');
    
    const status = await this.monitor.getStatus();
    if (status) {
      console.log(`Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
      console.log(`Scheduled: ${this.isScheduled ? '✅ Yes' : '❌ No'}`);
      console.log(`\nDatabase Stats:`);
      console.log(`   Total Listings: ${status.databaseStats.total_listings}`);
      console.log(`   New Listings: ${status.databaseStats.new_listings}`);
      console.log(`   Notified Listings: ${status.databaseStats.notified_listings}`);
      console.log(`   Last Run: ${status.databaseStats.last_run || 'Never'}`);
      
      console.log(`\nSearch URL:`);
      console.log(`   ${status.searchUrl}`);
    } else {
      console.log('❌ Could not retrieve status');
    }
    
    process.exit(0);
  }

  async stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏰ Cron job stopped');
    }
    
    await this.monitor.shutdown();
    this.isScheduled = false;
  }

  showHelp() {
    console.log('🆘 Usage: node src/index.js [command]\n');
    console.log('Commands:');
    console.log('  test        - Test all components (scraper, database, notifications)');
    console.log('  run-once    - Run the monitor once and exit');
    console.log('  start       - Start scheduled monitoring (default: every 15 minutes)');
    console.log('  status      - Show monitor status and statistics');
    console.log('  (no args)   - Show this help message\n');
    
    console.log('Examples:');
    console.log('  npm run test        # Test all components');
    console.log('  npm start           # Start scheduled monitoring');
    console.log('  node src/index.js run-once  # Run once');
    console.log('\nConfiguration:');
    console.log('  Edit src/config.js to customize search parameters');
    console.log('  Copy env.example to .env and configure email settings\n');
    
    process.exit(0);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  const app = new AirbnbMonitorApp();
  app.start().catch((error) => {
    console.error('❌ Application failed to start:', error.message);
    process.exit(1);
  });
}

module.exports = AirbnbMonitorApp; 