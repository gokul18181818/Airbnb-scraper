#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🏠 Airbnb Monitor Setup');
  console.log('=======================\n');
  
  console.log('This setup will help you configure your Airbnb monitoring bot.\n');
  
  // Check if .env already exists
  const envPath = '.env';
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
      console.log('Setup cancelled. You can manually edit .env or delete it and run setup again.');
      rl.close();
      return;
    }
  }

  console.log('\n📧 Email Configuration (for notifications):');
  console.log('If you\'re using Gmail, you\'ll need to create an "App Password"');
  console.log('Visit: https://support.google.com/accounts/answer/185833\n');
  
  const emailHost = await question('Email SMTP host (default: smtp.gmail.com): ') || 'smtp.gmail.com';
  const emailPort = await question('Email SMTP port (default: 587): ') || '587';
  const emailUser = await question('Your email address: ');
  const emailPass = await question('Your email password/app password: ');
  const emailTo = await question('Email to send notifications to (default: same as above): ') || emailUser;
  
  console.log('\n⚙️  Monitor Configuration:');
  const intervalMinutes = await question('Check interval in minutes (default: 15): ') || '15';
  const headless = await question('Run browser in headless mode? (Y/n): ');
  const enableNotifications = await question('Enable email notifications? (Y/n): ');
  
  // Create .env file
  const envContent = `# Email configuration for notifications
EMAIL_HOST=${emailHost}
EMAIL_PORT=${emailPort}
EMAIL_USER=${emailUser}
EMAIL_PASS=${emailPass}
EMAIL_TO=${emailTo}

# Monitoring configuration
MONITOR_INTERVAL_MINUTES=${intervalMinutes}
HEADLESS=${headless.toLowerCase() !== 'n'}
ENABLE_NOTIFICATIONS=${enableNotifications.toLowerCase() !== 'n'}

# Optional: Proxy settings (leave empty if not using)
PROXY_URL=

# Debug mode
DEBUG=false`;

  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Configuration saved to .env file');
  
  console.log('\n📋 Current Search Configuration (edit src/config.js to change):');
  console.log('   Location: Manhattan, NY');
  console.log('   Check-in: 2025-12-20');
  console.log('   Check-out: 2025-12-31');
  console.log('   Guests: 2');
  console.log('   Min Bedrooms: 2');
  console.log('   Max Price: $5,048');
  console.log('   Room Type: Entire home/apt');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Install Playwright browsers: npx playwright install chromium');
  console.log('3. Test the setup: npm run test');
  console.log('4. Run once to verify: node src/index.js run-once');
  console.log('5. Start monitoring: npm start');
  
  console.log('\n💡 Tips:');
  console.log('- Edit src/config.js to customize search parameters');
  console.log('- Use "node src/index.js status" to check monitor status');
  console.log('- The bot will create a data/ folder to store the database');
  console.log('- Check console output for any errors or blocking detection');
  
  rl.close();
}

setup().catch(console.error); 