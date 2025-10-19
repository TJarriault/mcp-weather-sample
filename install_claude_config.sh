#!/bin/bash

# Script d'installation et de configuration du serveur MCP Weather pour Claude

echo "🚀 Configuration du serveur MCP Weather pour Claude"
echo "=================================================="

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
CURRENT_DIR=$(pwd)
CONFIG_DIR="$HOME/.config/claude-desktop"
CLAUDE_CONFIG="$CONFIG_DIR/claude_desktop_config.json"

echo -e "${YELLOW}📁 Répertoire actuel: $CURRENT_DIR${NC}"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -f "src/index.ts" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis le répertoire racine du projet mcp-weather-sample${NC}"
    exit 1
fi

# Construire le projet
echo -e "${YELLOW}🔨 Construction du projet...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de la construction du projet${NC}"
    exit 1
fi

# Créer le répertoire de configuration Claude s'il n'existe pas
echo -e "${YELLOW}📂 Création du répertoire de configuration Claude...${NC}"
mkdir -p "$CONFIG_DIR"

# Backup de la configuration existante
if [ -f "$CLAUDE_CONFIG" ]; then
    echo -e "${YELLOW}💾 Sauvegarde de la configuration existante...${NC}"
    cp "$CLAUDE_CONFIG" "$CLAUDE_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Configuration pour le mode local (commande directe)
cat > "$CONFIG_DIR/claude_desktop_config.json" << EOF
{
  "mcpServers": {
    "weather-mcp-server": {
      "command": "node",
      "args": ["build/index.js"],
      "cwd": "$CURRENT_DIR",
      "env": {
        "PORT": "3001"
      }
    }
  }
}
EOF

echo -e "${GREEN}✅ Configuration Claude créée: $CLAUDE_CONFIG${NC}"

# Créer un service systemd pour le serveur MCP (optionnel)
read -p "Voulez-vous créer un service systemd pour démarrer automatiquement le serveur ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SERVICE_FILE="/etc/systemd/system/mcp-weather-server.service"
    
    echo -e "${YELLOW}📝 Création du service systemd...${NC}"
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=MCP Weather Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
Environment=PORT=3001
Environment=NODE_ENV=production
ExecStart=/usr/bin/node build/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    # Activer et démarrer le service
    sudo systemctl daemon-reload
    sudo systemctl enable mcp-weather-server
    sudo systemctl start mcp-weather-server
    
    echo -e "${GREEN}✅ Service systemd créé et démarré${NC}"
    echo -e "${YELLOW}🔍 Status du service: sudo systemctl status mcp-weather-server${NC}"
fi

# Afficher les informations de configuration
echo
echo -e "${GREEN}🎉 Configuration terminée !${NC}"
echo
echo -e "${YELLOW}📋 Informations importantes:${NC}"
echo "• Configuration Claude: $CLAUDE_CONFIG"
echo "• Répertoire du projet: $CURRENT_DIR"
echo "• Port du serveur: 3001"
echo "• Health check: http://localhost:3001/health"
echo "• Endpoint MCP: http://localhost:3001/mcp"
echo
echo -e "${YELLOW}🔧 Outils disponibles:${NC}"
echo "• get_weather: Obtenir la météo pour des coordonnées"
echo "• search_location: Rechercher des villes via API Open-Meteo"
echo "• search_local_cities: Rechercher dans les villes locales (CSV)"
echo "• stream_weather: Diffusion météo en temps réel"
echo
echo -e "${YELLOW}🚀 Pour démarrer manuellement le serveur:${NC}"
echo "  cd $CURRENT_DIR && npm start"
echo
echo -e "${YELLOW}🔄 Pour redémarrer Claude Desktop:${NC}"
echo "  Redémarrez l'application Claude Desktop pour prendre en compte la nouvelle configuration"
echo
echo -e "${GREEN}✨ C'est prêt ! Vous pouvez maintenant utiliser les outils météo dans Claude.${NC}"