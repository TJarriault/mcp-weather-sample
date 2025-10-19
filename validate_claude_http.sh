#!/bin/bash

# Script de validation de la configuration HTTP Claude
# Ce script vérifie que votre serveur MCP est prêt pour Claude Desktop

echo "🧪 Validation de la configuration HTTP Claude"
echo "=============================================="

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
SERVER_URL="http://localhost:8080"
MCP_ENDPOINT="$SERVER_URL/mcp"
HEALTH_ENDPOINT="$SERVER_URL/health"

echo -e "${BLUE}🔍 Vérification des prérequis...${NC}"

# Test 1: Vérifier que le serveur répond
echo -n "  • Serveur accessible : "
if curl -s "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
    HEALTH_RESPONSE=$(curl -s "$HEALTH_ENDPOINT")
    echo "    Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌${NC}"
    echo -e "${RED}    Le serveur n'est pas accessible sur $SERVER_URL${NC}"
    echo -e "${YELLOW}    Démarrez le serveur avec: npm start${NC}"
    exit 1
fi

# Test 2: Test d'initialisation MCP
echo -n "  • Endpoint MCP : "
INIT_PAYLOAD='{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {"tools": {}},
        "clientInfo": {"name": "validation-test", "version": "1.0.0"}
    }
}'

INIT_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d "$INIT_PAYLOAD")

if echo "$INIT_RESPONSE" | grep -q '"result"'; then
    echo -e "${GREEN}✅${NC}"
    SESSION_ID=$(echo "$INIT_RESPONSE" | grep -o '"Mcp-Session-Id":"[^"]*"' | cut -d'"' -f4)
    echo "    Session ID: $SESSION_ID"
else
    echo -e "${RED}❌${NC}"
    echo "    Response: $INIT_RESPONSE"
    exit 1
fi

echo -e "\n${BLUE}🛠️ Test des outils MCP...${NC}"

# Fonction pour tester un outil
test_tool() {
    local tool_name="$1"
    local tool_args="$2"
    local description="$3"
    
    echo -n "  • $description : "
    
    TOOL_PAYLOAD="{
        \"jsonrpc\": \"2.0\",
        \"id\": 2,
        \"method\": \"tools/call\",
        \"params\": {
            \"name\": \"$tool_name\",
            \"arguments\": $tool_args
        }
    }"
    
    TOOL_RESPONSE=$(curl -s -X POST "$MCP_ENDPOINT" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json, text/event-stream" \
        -H "Mcp-Session-Id: $SESSION_ID" \
        -d "$TOOL_PAYLOAD")
    
    if echo "$TOOL_RESPONSE" | grep -q '"result"' && ! echo "$TOOL_RESPONSE" | grep -q '"error"'; then
        echo -e "${GREEN}✅${NC}"
        return 0
    else
        echo -e "${RED}❌${NC}"
        echo "    Error: $(echo "$TOOL_RESPONSE" | jq -r '.error.message // "Unknown error"' 2>/dev/null || echo "Parse error")"
        return 1
    fi
}

# Test des outils
TOOLS_PASSED=0
TOOLS_TOTAL=4

if test_tool "search_local_cities" '{"city_name":"Par","exact_match":false,"limit":1}' "search_local_cities"; then
    ((TOOLS_PASSED++))
fi

if test_tool "search_location" '{"city_name":"Lyon","limit":1}' "search_location"; then
    ((TOOLS_PASSED++))
fi

if test_tool "get_weather" '{"latitude":48.8566,"longitude":2.3522,"location_name":"Paris"}' "get_weather"; then
    ((TOOLS_PASSED++))
fi

if test_tool "stream_weather" '{"latitude":43.2965,"longitude":5.3698,"location_name":"Marseille"}' "stream_weather"; then
    ((TOOLS_PASSED++))
fi

echo -e "\n${BLUE}📋 Configuration Claude recommandée:${NC}"
echo "====================================="

cat << EOF
{
  "mcpServers": {
    "weather-mcp-server-http": {
      "description": "Serveur MCP météo accessible via HTTP",
      "transport": {
        "type": "http",
        "url": "$MCP_ENDPOINT",
        "headers": {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream"
        }
      },
      "capabilities": ["tools"],
      "timeout": 30000,
      "retries": 3
    }
  }
}
EOF

echo -e "\n${BLUE}📊 Résultats:${NC}"
echo "============"
echo "• Serveur accessible : ✅"
echo "• Initialisation MCP : ✅"
echo "• Outils fonctionnels : $TOOLS_PASSED/$TOOLS_TOTAL"

if [ "$TOOLS_PASSED" -eq "$TOOLS_TOTAL" ]; then
    echo -e "\n${GREEN}🎉 Tous les tests sont passés !${NC}"
    echo -e "${GREEN}Votre serveur MCP est prêt pour Claude Desktop.${NC}"
    echo
    echo -e "${YELLOW}📝 Prochaines étapes :${NC}"
    echo "1. Copiez la configuration ci-dessus dans votre fichier Claude Desktop"
    echo "2. Redémarrez Claude Desktop"
    echo "3. Testez avec des commandes comme : 'Recherche Paris dans nos villes locales'"
    exit 0
else
    echo -e "\n${RED}⚠️ Certains tests ont échoué.${NC}"
    echo -e "${YELLOW}Vérifiez les logs du serveur et la configuration.${NC}"
    exit 1
fi
