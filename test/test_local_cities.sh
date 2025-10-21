#!/bin/bash

echo "🧪 Testing local cities search functionality"
echo "=================================================="

# Start server in background
echo "🚀 Starting MCP server..."
npm start &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server startup..."
sleep 3

# Check if server started
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Server started successfully"
    
    # Run tests
    echo "🧪 Running tests..."
    node test_local_cities.js
    
    echo "🏁 Tests completed"
else
    echo "❌ Error: Server failed to start"
fi

# Stop server
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null || true

echo "✅ Done!"
