#!/bin/bash

# Configuration simple pour tester les tools MCP
AUTH_HOST=keycloak.192.168.49.2.nip.io
OAUTH_CLIENT_ID=mcpweather-client
OAUTH_CLIENT_SECRET=HFLjyBhlfn2WgQZWVBZ5ASItetLL04iW
MCP_SERVER_URL=http://localhost:8082

echo "🔐 Test d'obtention du token..."
TOKEN_RESPONSE=$(curl -X POST -k -s \
  -d "client_id=${OAUTH_CLIENT_ID}" \
  -d "client_secret=${OAUTH_CLIENT_SECRET}" \
  -d "grant_type=client_credentials" \
  "https://${AUTH_HOST}/realms/master/protocol/openid-connect/token")

echo "Réponse token: $TOKEN_RESPONSE"

TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r .access_token 2>/dev/null)

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Impossible d'obtenir le token"
  exit 1
fi

echo "✅ Token obtenu"

echo "📋 Test de requête MCP tools/list..."
curl -X POST -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }' \
  "${MCP_SERVER_URL}" | jq '.'
