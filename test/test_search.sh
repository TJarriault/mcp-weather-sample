#!/bin/bash

# Test script for search_location function
echo "🔍 Testing search_location function on MCP server"
echo "=================================================="

# Check server accessibility
echo "1. Server health test..."
curl -s http://localhost:8081/health | jq .
echo ""

# MCP initialization test
echo "2. MCP initialization..."
INIT_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {"tools": {}},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
  }' \
  http://localhost:8081/mcp -D headers.tmp)

# Extract session ID
SESSION_ID=$(grep -i "mcp-session-id" headers.tmp | cut -d: -f2 | tr -d ' \r\n')
echo "Session ID: $SESSION_ID"
echo "Initialization response:"
echo "$INIT_RESPONSE" | jq .
echo ""

# List tools
echo "3. Available tools list..."
TOOLS_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }' \
  http://localhost:8081/mcp)

echo "Available tools:"
echo "$TOOLS_RESPONSE" | jq .
echo ""

# Test search_location for Paris
echo "4. Testing search_location for Paris..."
PARIS_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "search_location",
      "arguments": {
        "city_name": "Paris",
        "limit": 3
      }
    }
  }' \
  http://localhost:8081/mcp)

echo "Results for Paris:"
echo "$PARIS_RESPONSE" | jq .
echo ""

# Test search_location for Lyon with country filter
echo "5. Testing search_location for Lyon, France..."
LYON_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "search_location",
      "arguments": {
        "city_name": "Lyon",
        "country": "France",
        "limit": 2
      }
    }
  }' \
  http://localhost:8081/mcp)

echo "Results for Lyon, France:"
echo "$LYON_RESPONSE" | jq .
echo ""

# Cleanup
rm -f headers.tmp

echo "✅ Tests completed!"