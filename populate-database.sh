#!/bin/bash

echo "🗽 Populating Database with ALL New York City Listings"
echo "===================================================="
echo ""
echo "This will:"
echo "📍 Search ALL of New York City (not just Times Square)"
echo "📄 Scrape multiple pages (up to 15 pages = 300+ listings)"
echo "💾 Build comprehensive database of existing listings"
echo "🎯 Future runs will only email for truly NEW listings"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "🚀 Starting comprehensive NYC scan..."
echo "⏱️  This may take 5-10 minutes..."
echo ""

# Clear existing database to start fresh
rm -rf data/listings.db

# Run a single comprehensive scan
node src/index.js run-once

echo ""
echo "✅ Database population complete!"
echo ""
echo "📊 Check results:"
echo "  ./check-status.sh"
echo ""
echo "🚀 Start monitoring for NEW listings:"
echo "  ./start-monitor.sh" 