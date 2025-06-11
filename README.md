# 🏠 Airbnb Listing Monitor

A Node.js application that monitors Airbnb for new listings matching your specific criteria and sends instant notifications when new properties become available.

## ✨ Features

- **Real-time Monitoring**: Checks for new listings at configurable intervals
- **Smart Detection**: Identifies truly new listings vs. previously seen ones
- **Email Notifications**: Beautiful HTML email alerts with listing details
- **Robust Scraping**: Uses Playwright for reliable, anti-detection web scraping
- **Data Persistence**: SQLite database to track all listings and prevent duplicates
- **Configurable Search**: Customize location, dates, price, bedrooms, and more
- **Scheduling**: Built-in cron job scheduler for automated monitoring
- **Status Monitoring**: Check bot status and view statistics

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo>
cd airbnb-listing-monitor
npm install
npx playwright install chromium
```

### 2. Setup Configuration

```bash
npm run setup
```

This will guide you through:
- Email configuration (for notifications)
- Monitor settings (intervals, headless mode)
- Notification preferences

### 3. Test the Setup

```bash
npm run test
```

### 4. Run Once to Verify

```bash
node src/index.js run-once
```

### 5. Start Monitoring

```bash
npm start
```

## 📋 Current Search Configuration

The bot is pre-configured to monitor:

- **Location**: Manhattan, NY
- **Check-in**: December 20, 2025
- **Check-out**: December 31, 2025
- **Guests**: 2
- **Min Bedrooms**: 2
- **Max Price**: $5,048
- **Room Type**: Entire home/apt

## ⚙️ Configuration

### Search Parameters

Edit `src/config.js` to customize your search:

```javascript
search: {
  location: "Manhattan, NY",
  checkin: "2025-12-20",
  checkout: "2025-12-31",
  adults: 2,
  guests: 2,
  minBedrooms: 2,
  maxPrice: 5048,
  roomType: "Entire home/apt"
}
```

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Email notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_TO=your-email@gmail.com

# Monitor settings
MONITOR_INTERVAL_MINUTES=15
HEADLESS=true
ENABLE_NOTIFICATIONS=true
```

### Gmail Setup

For Gmail notifications:
1. Enable 2-factor authentication
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password (not your regular password) in the `EMAIL_PASS` field

## 🔧 Commands

```bash
# Run setup wizard
npm run setup

# Test all components
npm run test

# Run monitor once and exit
node src/index.js run-once

# Start scheduled monitoring
npm start

# Check status and statistics
node src/index.js status

# Show help
node src/index.js
```

## 📊 How It Works

1. **URL Generation**: Builds Airbnb search URLs with your parameters
2. **Web Scraping**: Uses Playwright to load pages and extract listing data
3. **Data Storage**: Saves listings to SQLite database with unique IDs
4. **New Detection**: Compares current listings with previous runs
5. **Notifications**: Sends email alerts for genuinely new listings
6. **Scheduling**: Runs automatically at configured intervals

## 📧 Email Notifications

When new listings are found, you'll receive:

- **Rich HTML emails** with property images and details
- **Direct booking links** to act fast
- **Search criteria summary** to confirm settings
- **Mobile-friendly formatting** for on-the-go alerts

## 🛡️ Anti-Detection Features

- **Human-like browsing**: Random delays and scrolling patterns
- **Proper headers**: Real browser user agents and headers
- **Rate limiting**: Configurable intervals to avoid being blocked
- **Error handling**: Graceful handling of CAPTCHAs and blocks

## 📁 Project Structure

```
airbnb-listing-monitor/
├── src/
│   ├── config.js       # Configuration and URL building
│   ├── database.js     # SQLite database management
│   ├── scraper.js      # Playwright web scraping
│   ├── notifications.js # Email notification system
│   ├── monitor.js      # Main monitoring orchestrator
│   ├── index.js        # CLI interface and scheduling
│   └── setup.js        # Interactive setup wizard
├── data/
│   └── listings.db     # SQLite database (auto-created)
├── package.json
├── README.md
└── env.example
```

## 🐛 Troubleshooting

### No Listings Found
- Check if Airbnb changed their page structure
- Verify your search criteria aren't too restrictive
- Try running with `HEADLESS=false` to see what's happening

### Email Not Working
- Verify email credentials in `.env`
- For Gmail, ensure you're using an App Password
- Check spam folder for notifications

### Getting Blocked
- Increase `MONITOR_INTERVAL_MINUTES` to reduce frequency
- Consider using a proxy (set `PROXY_URL`)
- Check for CAPTCHA prompts when running with `HEADLESS=false`

### Database Issues
- Delete `data/listings.db` to start fresh
- Check file permissions in the data directory

## 📈 Statistics and Monitoring

View statistics with:

```bash
node src/index.js status
```

This shows:
- Current monitor status
- Database statistics
- Search configuration
- Last run timestamp

## 🔄 Customization

### Different Location
Edit `src/config.js` and update the `location` and `placeId` fields.

### Different Dates
Update `checkin` and `checkout` in the search configuration.

### Price Range
Modify `maxPrice` or add `minPrice` if needed.

### Notification Frequency
- Adjust `MONITOR_INTERVAL_MINUTES` in `.env`
- Shorter intervals = faster notifications but higher risk of being blocked

## 🚨 Important Notes

- **Act Fast**: Popular listings can be booked within minutes
- **Legal Use**: This tool is for personal use only
- **Rate Limiting**: Don't set intervals too low to avoid being blocked
- **Accuracy**: Listings might occasionally appear as "new" due to Airbnb's dynamic content

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ⚠️ Disclaimer

This tool is for educational and personal use only. Use responsibly and in accordance with Airbnb's terms of service. The authors are not responsible for any misuse or violations.

---

**Happy house hunting! 🏠✨** 