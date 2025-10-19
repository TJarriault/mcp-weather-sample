#!/bin/bash

# Script de test pour la fonction search_location
echo "🔍 Test de la fonction search_location sur le serveur MCP"
echo "=================================================="

# Vérifier que le serveur est accessible
echo "1. Test de santé du serveur..."
curl -s http://localhost:8081/health | jq .
echo ""

# Test d'initialisation MCP
echo "2. Initialisation MCP..."
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

# Extraire l'ID de session
SESSION_ID=$(grep -i "mcp-session-id" headers.tmp | cut -d: -f2 | tr -d ' \r\n')
echo "Session ID: $SESSION_ID"
echo "Réponse d'initialisation:"
echo "$INIT_RESPONSE" | jq .
echo ""

# Lister les outils
echo "3. Liste des outils disponibles..."
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

echo "Outils disponibles:"
echo "$TOOLS_RESPONSE" | jq .
echo ""

# Test de search_location pour Paris
echo "4. Test search_location pour Paris..."
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

echo "Résultats pour Paris:"
echo "$PARIS_RESPONSE" | jq .
echo ""

# Test de search_location pour Lyon avec filtre pays
echo "5. Test search_location pour Lyon, France..."
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

echo "Résultats pour Lyon, France:"
echo "$LYON_RESPONSE" | jq .
echo ""

# Nettoyer
rm -f headers.tmp

echo "✅ Tests terminés !"