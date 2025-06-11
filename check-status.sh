#!/bin/bash

# Airbnb Monitor Status Checker
echo "📊 Airbnb Monitor Status"
echo "======================="

if [ -f logs/monitor.pid ]; then
    PID=$(cat logs/monitor.pid)
    
    if kill -0 "$PID" 2>/dev/null; then
        echo "✅ Status: RUNNING (PID: $PID)"
        
        # Show when it started
        if [ -f logs/monitor.log ]; then
            START_TIME=$(head -n 5 logs/monitor.log | grep "Starting" | tail -1)
            if [ ! -z "$START_TIME" ]; then
                echo "🕐 Started: $START_TIME"
            fi
        fi
    else
        echo "❌ Status: NOT RUNNING (stale PID: $PID)"
        rm logs/monitor.pid
    fi
else
    echo "❌ Status: NOT RUNNING"
fi

echo ""

# Show database stats
echo "📈 Database Statistics:"
node src/index.js status 2>/dev/null | grep -A 5 "Database Stats:" | tail -4

echo ""

# Show recent log activity
if [ -f logs/monitor.log ]; then
    echo "📄 Recent Activity (last 10 lines):"
    echo "------------------------------------"
    tail -10 logs/monitor.log
else
    echo "📄 No logs found"
fi

echo ""
echo "Commands:"
echo "  Start:     ./start-monitor.sh"
echo "  Stop:      ./stop-monitor.sh"
echo "  Live logs: tail -f logs/monitor.log" 