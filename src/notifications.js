const nodemailer = require('nodemailer');
const config = require('./config');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (!config.email.user || !config.email.pass) {
      console.log('Email credentials not configured. Email notifications disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }

  async sendNewListingAlert(listings) {
    // Sort listings by price (lowest first)
    const sortedListings = listings.sort((a, b) => {
      const priceA = a.priceNumeric || 999999;
      const priceB = b.priceNumeric || 999999;
      return priceA - priceB;
    });

    if (!this.transporter || !config.monitor.enableNotifications) {
      console.log('Email notifications disabled. New listings found (sorted by lowest price):');
      this.logListingsToConsole(sortedListings);
      return;
    }

    try {
      const htmlContent = this.generateEmailHTML(sortedListings);
      const textContent = this.generateEmailText(sortedListings);

      const mailOptions = {
        from: config.email.user,
        to: config.email.to,
        subject: `🏠 ${sortedListings.length} New Airbnb Listing${sortedListings.length > 1 ? 's' : ''} Found in ${config.search.location}! (Sorted by Price)`,
        text: textContent,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Notification email sent: ${info.messageId}`);
      return true;

    } catch (error) {
      console.error('Error sending notification email:', error.message);
      // Fallback to console logging
      this.logListingsToConsole(listings);
      return false;
    }
  }

  generateEmailHTML(listings) {
    const listingItems = listings.map(listing => `
      <div style="border: 1px solid #ddd; border-radius: 8px; margin: 20px 0; padding: 15px; background-color: #f9f9f9;">
        <h3 style="margin-top: 0; color: #333;">
          <a href="${listing.url}" style="color: #FF5A5F; text-decoration: none;">${listing.title}</a>
        </h3>
        
        <div style="display: flex; align-items: center; margin: 10px 0;">
          ${listing.image_url ? `<img src="${listing.image_url}" alt="Listing image" style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px; margin-right: 15px;">` : ''}
          <div>
            <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #333;">${listing.price}</p>
            ${listing.bedrooms ? `<p style="margin: 5px 0; color: #666;">🛏️ ${listing.bedrooms} bedroom${listing.bedrooms > 1 ? 's' : ''}</p>` : ''}
            ${listing.guests ? `<p style="margin: 5px 0; color: #666;">👥 ${listing.guests} guest${listing.guests > 1 ? 's' : ''}</p>` : ''}
            ${listing.rating ? `<p style="margin: 5px 0; color: #666;">⭐ ${listing.rating}${listing.review_count ? ` (${listing.review_count} reviews)` : ''}</p>` : ''}
            ${listing.host_name ? `<p style="margin: 5px 0; color: #666;">🏠 Host: ${listing.host_name}</p>` : ''}
          </div>
        </div>
        
        <div style="margin-top: 15px;">
          <a href="${listing.url}" 
             style="background-color: #FF5A5F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            View Listing →
          </a>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Airbnb Listings</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #FF5A5F; text-align: center;">🏠 New Airbnb Listings Found!</h1>
        
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Search Criteria:</h3>
          <ul style="margin: 10px 0;">
            <li><strong>Location:</strong> ${config.search.location}</li>
            <li><strong>Check-in:</strong> ${config.search.checkin}</li>
            <li><strong>Check-out:</strong> ${config.search.checkout}</li>
            <li><strong>Guests:</strong> ${config.search.guests}</li>
            <li><strong>Min Bedrooms:</strong> ${config.search.minBedrooms}</li>
            <li><strong>Max Price:</strong> $${config.search.maxPrice}</li>
            <li><strong>Room Type:</strong> ${config.search.roomType}</li>
          </ul>
        </div>

        <h2 style="color: #333;">Found ${listings.length} new listing${listings.length > 1 ? 's' : ''}:</h2>
        
        ${listingItems}
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
          <p style="color: #666; margin: 0;">
            This alert was generated by your Airbnb monitoring bot.<br>
            <strong>Act fast!</strong> New listings can be booked quickly.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  generateEmailText(listings) {
    const header = `🏠 NEW AIRBNB LISTINGS FOUND!\n\n${listings.length} new listing${listings.length > 1 ? 's' : ''} found in ${config.search.location}\n\n`;
    
    const criteria = `SEARCH CRITERIA:
- Location: ${config.search.location}
- Check-in: ${config.search.checkin}
- Check-out: ${config.search.checkout}
- Guests: ${config.search.guests}
- Min Bedrooms: ${config.search.minBedrooms}
- Max Price: $${config.search.maxPrice}
- Room Type: ${config.search.roomType}

LISTINGS:\n\n`;

    const listingItems = listings.map((listing, index) => {
      let item = `${index + 1}. ${listing.title}\n`;
      item += `   Price: ${listing.price}\n`;
      if (listing.bedrooms) item += `   Bedrooms: ${listing.bedrooms}\n`;
      if (listing.guests) item += `   Guests: ${listing.guests}\n`;
      if (listing.rating) item += `   Rating: ${listing.rating}${listing.review_count ? ` (${listing.review_count} reviews)` : ''}\n`;
      if (listing.host_name) item += `   Host: ${listing.host_name}\n`;
      item += `   Link: ${listing.url}\n\n`;
      return item;
    }).join('');

    const footer = `\nAct fast! New listings can be booked quickly.\n\nThis alert was generated by your Airbnb monitoring bot.`;

    return header + criteria + listingItems + footer;
  }

  logListingsToConsole(listings) {
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 FOUND ${listings.length} NEW LISTING${listings.length > 1 ? 'S' : ''}!`);
    console.log('='.repeat(50));
    
    listings.forEach((listing, index) => {
      console.log(`\n${index + 1}. ${listing.title}`);
      console.log(`   💰 ${listing.price}`);
      if (listing.bedrooms) console.log(`   🛏️  ${listing.bedrooms} bedroom${listing.bedrooms > 1 ? 's' : ''}`);
      if (listing.guests) console.log(`   👥 ${listing.guests} guest${listing.guests > 1 ? 's' : ''}`);
      if (listing.rating) console.log(`   ⭐ ${listing.rating}${listing.review_count ? ` (${listing.review_count} reviews)` : ''}`);
      if (listing.host_name) console.log(`   🏠 Host: ${listing.host_name}`);
      console.log(`   🔗 ${listing.url}`);
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('🚀 Act fast! New listings can be booked quickly.');
    console.log('='.repeat(50) + '\n');
  }

  async testEmail() {
    if (!this.transporter) {
      console.log('Email not configured. Cannot send test email.');
      return false;
    }

    try {
      const testMailOptions = {
        from: config.email.user,
        to: config.email.to,
        subject: '🧪 Airbnb Monitor Test Email',
        text: 'This is a test email from your Airbnb monitoring bot. If you received this, email notifications are working correctly!',
        html: `
          <h2>🧪 Test Email</h2>
          <p>This is a test email from your Airbnb monitoring bot.</p>
          <p><strong>If you received this, email notifications are working correctly!</strong></p>
          <p>Search criteria: ${config.search.location}, ${config.search.checkin} - ${config.search.checkout}</p>
        `
      };

      const info = await this.transporter.sendMail(testMailOptions);
      console.log(`Test email sent successfully: ${info.messageId}`);
      return true;

    } catch (error) {
      console.error('Error sending test email:', error.message);
      return false;
    }
  }
}

module.exports = NotificationService; 