#!/bin/bash

# Airbnb Monitor Background Starter
echo "🏠 Starting Airbnb Monitor in Background..."
echo "📅 Checking every 1 hour for new listings"
echo "📧 Will only email for NEW listings"
echo "💰 Max price: $4,879 | Location: Times Square, Manhattan"
echo ""

# Create logs directory
mkdir -p logs

# Start the monitor in background
nohup node src/index.js start > logs/monitor.log 2>&1 &

# Get the process ID
PID=$!
echo $PID > logs/monitor.pid

echo "✅ Monitor started in background!"
echo "📝 Process ID: $PID"
echo "📄 Logs: logs/monitor.log"
echo ""
echo "Commands:"
echo "  Check status:  npm run status"
echo "  View logs:     tail -f logs/monitor.log"
echo "  Stop monitor:  ./stop-monitor.sh"
echo ""
echo "🚀 Your Airbnb monitor is now running every hour!" 