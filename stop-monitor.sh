#!/bin/bash

# Airbnb Monitor Background Stopper
echo "🛑 Stopping Airbnb Monitor..."

if [ -f logs/monitor.pid ]; then
    PID=$(cat logs/monitor.pid)
    
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        rm logs/monitor.pid
        echo "✅ Monitor stopped (PID: $PID)"
    else
        echo "⚠️  Process not running (PID: $PID)"
        rm logs/monitor.pid
    fi
else
    echo "⚠️  No PID file found. Monitor may not be running."
fi

echo ""
echo "Commands:"
echo "  Start monitor: ./start-monitor.sh"
echo "  Check status:  npm run status" 