require('dotenv').config();

const config = {
  // Search parameters for ALL of New York City
  search: {
    location: "New York, NY",
    placeId: "ChIJOwg_06VPwokRYv534QaPC8g", // NYC place ID
    checkin: "2025-08-15",
    checkout: "2025-12-20",
    adults: 2,
    guests: 2,
    minBedrooms: 2,
    maxPrice: 4879,
    roomType: "Entire home/apt",
    // All NYC boroughs
    mapBounds: {
      ne_lat: 40.9176,
      ne_lng: -73.7004,
      sw_lat: 40.4774,
      sw_lng: -74.2591,
      zoom: 10.5
    },
    // Pagination settings
    maxPages: 15  // Comprehensive NYC coverage (~300 listings)
  },

  // Monitoring settings
  monitor: {
    intervalMinutes: parseInt(process.env.MONITOR_INTERVAL_MINUTES) || 15,
    headless: process.env.HEADLESS !== 'false',
    enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false',
    debug: process.env.DEBUG === 'true'
  },

  // Email settings
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO
  },

  // Browser settings
  browser: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    timeout: 30000,
    proxy: process.env.PROXY_URL || null
  },

  // Database
  database: {
    path: './data/listings.db'
  }
};

// Build the search URL
config.buildSearchUrl = function() {
  const params = new URLSearchParams({
    'refinement_paths[]': '/homes',
    checkin: this.search.checkin,
    checkout: this.search.checkout,
    date_picker_type: 'calendar',
    adults: this.search.adults,
    guests: this.search.guests,
    search_type: 'user_map_move',
    'flexible_trip_lengths[]': 'one_week',
    monthly_start_date: '2025-07-01',
    monthly_length: '3',
    monthly_end_date: '2025-10-01',
    price_filter_input_type: '1',
    price_filter_num_nights: '127',
    channel: 'EXPLORE',
    'room_types[]': 'Entire home/apt',
    'selected_filter_order[]': ['room_types:Entire home/apt', `min_bedrooms:${this.search.minBedrooms}`, `price_max:${this.search.maxPrice}`],
    update_selected_filters: 'true',
    min_bedrooms: this.search.minBedrooms,
    place_id: this.search.placeId,
    source: 'structured_search_input_header',
    query: this.search.location,
    search_mode: 'regular_search',
    ne_lat: this.search.mapBounds.ne_lat,
    ne_lng: this.search.mapBounds.ne_lng,
    sw_lat: this.search.mapBounds.sw_lat,
    sw_lng: this.search.mapBounds.sw_lng,
    zoom: this.search.mapBounds.zoom,
    zoom_level: this.search.mapBounds.zoom,
    search_by_map: 'true',
    price_max: this.search.maxPrice
  });

  return `https://www.airbnb.com/s/${encodeURIComponent(this.search.location)}/homes?${params.toString()}`;
};

module.exports = config; 