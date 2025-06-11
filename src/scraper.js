const { chromium } = require('playwright');
const config = require('./config');

class AirbnbScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    const launchOptions = {
      headless: config.monitor.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };

    if (config.browser.proxy) {
      launchOptions.proxy = { server: config.browser.proxy };
    }

    this.browser = await chromium.launch(launchOptions);
    
    const context = await this.browser.newContext({
      userAgent: config.browser.userAgent,
      viewport: config.browser.viewport,
      locale: 'en-US',
      timezoneId: 'America/New_York'
    });

    this.page = await context.newPage();
    
    // Set random delays to appear more human
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    return this;
  }

  async scrapeListings() {
    try {
      const allListings = [];
      const maxPages = config.search.maxPages || 3;

      for (let page = 1; page <= maxPages; page++) {
        console.log(`📄 Scraping page ${page} of ${maxPages}...`);
        
        const url = this.buildPageUrl(page);
        console.log(`Navigating to: ${url.substring(0, 100)}...`);

        await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });

        // Wait for listings to load
        try {
          await this.page.waitForSelector('[data-testid="card-container"]', { 
            timeout: 30000 
          });
        } catch (error) {
          console.log(`No more listings found on page ${page}`);
          break;
        }

        // Scroll to load all listings on this page
        await this.scrollToLoadListings();

        // Extract listing data from this page
        const pageListings = await this.extractListingData();
        
        if (pageListings.length === 0) {
          console.log(`No listings found on page ${page}, stopping pagination`);
          break;
        }

        allListings.push(...pageListings);
        console.log(`Found ${pageListings.length} listings on page ${page} (total: ${allListings.length})`);

        // Random delay between pages to avoid being blocked
        const delay = 2000 + Math.random() * 3000;
        console.log(`Waiting ${(delay/1000).toFixed(1)}s before next page...`);
        await this.page.waitForTimeout(delay);
      }
      
      console.log(`🎉 Total listings found: ${allListings.length} across all pages`);
      return allListings;

    } catch (error) {
      console.error('Error scraping listings:', error.message);
      throw error;
    }
  }

  buildPageUrl(pageNumber) {
    const baseUrl = config.buildSearchUrl();
    const url = new URL(baseUrl);
    
    // Add pagination parameter
    if (pageNumber > 1) {
      url.searchParams.set('section_offset', (pageNumber - 1).toString());
    }
    
    return url.toString();
  }

  async scrollToLoadListings() {
    let previousHeight = 0;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      // Scroll down
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for new content to load
      await this.page.waitForTimeout(2000 + Math.random() * 1000);

      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);
      
      if (currentHeight === previousHeight) {
        attempts++;
      } else {
        attempts = 0;
        previousHeight = currentHeight;
      }

      // Random small scroll back up to appear more human
      if (Math.random() < 0.3) {
        await this.page.evaluate(() => {
          window.scrollBy(0, -Math.random() * 200);
        });
        await this.page.waitForTimeout(500);
      }
    }
  }

  async extractListingData() {
    return await this.page.evaluate(() => {
      const listings = [];
      const cards = document.querySelectorAll('[data-testid="card-container"]');

      cards.forEach((card, index) => {
        try {
          // Extract basic info
          const linkElement = card.querySelector('a[href*="/rooms/"]');
          if (!linkElement) return;

          const url = linkElement.href;
          const urlParts = url.split('/');
          const id = urlParts.find(part => part.match(/^\d+$/)) || `unknown-${index}`;

          // Title
          const titleElement = card.querySelector('[data-testid="listing-card-title"]') || 
                               card.querySelector('[data-testid="listing-card-name"]') ||
                               card.querySelector('h3') ||
                               linkElement;
          const title = titleElement ? titleElement.textContent.trim() : 'No title';

          // Price
          const priceElement = card.querySelector('[data-testid="price-availability"]') ||
                              card.querySelector('[data-testid="price"]') ||
                              card.querySelector('span[aria-hidden="true"]') ||
                              card.querySelector('._1y74zjx');
          let price = 'Price not found';
          let priceNumeric = 0;
          if (priceElement) {
            const priceText = priceElement.textContent.trim();
            price = priceText.replace(/\s+/g, ' ');
            
            // Extract numeric price for sorting
            const priceMatch = priceText.match(/\$?([\d,]+)/);
            if (priceMatch) {
              priceNumeric = parseInt(priceMatch[1].replace(/,/g, ''));
            }
          }

          // Image
          const imageElement = card.querySelector('img');
          const imageUrl = imageElement ? imageElement.src : null;

          // Rating and reviews
          let rating = null;
          let reviewCount = 0;
          const ratingElement = card.querySelector('[data-testid="listing-card-subtitle"]') ||
                               card.querySelector('span[aria-label*="rating"]');
          if (ratingElement) {
            const ratingText = ratingElement.textContent;
            const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
            const reviewMatch = ratingText.match(/\((\d+)\)/);
            
            if (ratingMatch) rating = parseFloat(ratingMatch[1]);
            if (reviewMatch) reviewCount = parseInt(reviewMatch[1]);
          }

          // Try to extract bedroom/guest info from title or subtitle
          let bedrooms = null;
          let guests = null;
          
          const subtitleElements = card.querySelectorAll('[data-testid="listing-card-subtitle"]');
          subtitleElements.forEach(el => {
            const text = el.textContent.toLowerCase();
            if (text.includes('bedroom')) {
              const bedroomMatch = text.match(/(\d+)\s*bedroom/);
              if (bedroomMatch) bedrooms = parseInt(bedroomMatch[1]);
            }
            if (text.includes('guest')) {
              const guestMatch = text.match(/(\d+)\s*guest/);
              if (guestMatch) guests = parseInt(guestMatch[1]);
            }
          });

          // Host name (if available)
          let hostName = null;
          const hostElement = card.querySelector('[data-testid="listing-card-host"]');
          if (hostElement) {
            hostName = hostElement.textContent.trim();
          }

          listings.push({
            id,
            url,
            title,
            price,
            priceNumeric,
            bedrooms,
            bathrooms: null, // Hard to extract reliably
            guests,
            imageUrl,
            hostName,
            rating,
            reviewCount
          });

        } catch (error) {
          console.error('Error extracting listing data:', error);
        }
      });

      return listings;
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Helper method to handle potential blocking
  async handlePotentialBlocking() {
    try {
      // Check for common blocking indicators
      const blockingSelectors = [
        '[data-testid="captcha"]',
        '.captcha',
        '#captcha',
        'iframe[src*="captcha"]',
        'iframe[src*="recaptcha"]'
      ];

      for (const selector of blockingSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          throw new Error('Detected CAPTCHA or blocking mechanism');
        }
      }

      // Check if we're on an error page
      const title = await this.page.title();
      if (title.toLowerCase().includes('error') || 
          title.toLowerCase().includes('blocked') ||
          title.toLowerCase().includes('captcha')) {
        throw new Error(`Potential blocking detected. Page title: ${title}`);
      }

    } catch (error) {
      console.error('Blocking detection error:', error.message);
      throw error;
    }
  }
}

module.exports = AirbnbScraper; 