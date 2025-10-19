# Configuration Claude Desktop pour MCP Weather Server

Ce répertoire contient plusieurs fichiers de configuration pour intégrer le serveur MCP Weather avec Claude Desktop.

## 📁 Fichiers de configuration

### 1. `claude_config.json` - Configuration de base
Configuration minimale pour Claude Desktop en mode local :
```json
{
  "mcpServers": {
    "weather-mcp-server": {
      "command": "node",
      "args": ["build/index.js"],
      "cwd": "/appli/sogeti/devfest-mcp-a2a/mcp-weather-sample",
      "env": {
        "PORT": "8080"
      }
    }
  }
}
```

### 2. `claude_config_detailed.json` - Configuration avancée
Configuration avec descriptions détaillées et options avancées.

### 3. `claude_config_http.json` - Configuration HTTP
Configuration pour utiliser le serveur MCP via HTTP (serveur distant).

## 🚀 Installation automatique

Utilisez le script d'installation automatique :

```bash
./install_claude_config.sh
```

Ce script va :
- Construire le projet
- Créer la configuration Claude Desktop
- Optionnellement créer un service systemd
- Configurer tous les chemins automatiquement

## 🔧 Installation manuelle

### Étape 1: Construire le projet
```bash
npm run build
```

### Étape 2: Copier la configuration
Copiez le contenu de `claude_config.json` dans votre fichier de configuration Claude Desktop :

**Linux/macOS:**
```bash
~/.config/claude-desktop/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### Étape 3: Adapter les chemins
Modifiez le champ `cwd` pour pointer vers votre répertoire d'installation :
```json
"cwd": "/votre/chemin/vers/mcp-weather-sample"
```

### Étape 4: Redémarrer Claude Desktop
Redémarrez l'application Claude Desktop pour prendre en compte la nouvelle configuration.

## 🛠️ Outils disponibles

Une fois configuré, vous aurez accès aux outils suivants dans Claude :

### `get_weather`
Obtient les informations météo actuelles pour une localisation.
- **Paramètres:** latitude, longitude, location_name (optionnel)
- **Exemple:** "Quelle est la météo à Paris (48.8566, 2.3522) ?"

### `search_location`
Recherche les coordonnées GPS d'une ville via l'API Open-Meteo.
- **Paramètres:** city_name, country (optionnel), limit (optionnel)
- **Exemple:** "Trouve les coordonnées de Lyon en France"

### `search_local_cities`
Recherche des villes dans les fichiers CSV locaux du répertoire static.
- **Paramètres:** city_name, exact_match (optionnel), limit (optionnel)
- **Exemple:** "Cherche toutes les villes qui contiennent 'Saint' dans nos données locales"

### `stream_weather`
Configure un flux de mises à jour météo en temps réel.
- **Paramètres:** latitude, longitude, location_name (optionnel), interval_seconds (optionnel)
- **Exemple:** "Démarre un flux météo pour Marseille avec des mises à jour toutes les 30 secondes"

## 🔍 Vérification

### Tester la configuration
1. Démarrez le serveur MCP :
   ```bash
   npm start
   ```

2. Vérifiez que le serveur fonctionne :
   ```bash
   curl http://localhost:8080/health
   ```

3. Dans Claude Desktop, essayez une commande comme :
   "Peux-tu rechercher les coordonnées de Paris dans nos données locales ?"

### Logs et débogage
- Logs du serveur : visible dans la console où vous avez démarré `npm start`
- Logs Claude Desktop : consultez les logs de l'application Claude Desktop
- Configuration système : si vous avez installé le service systemd, utilisez :
  ```bash
  sudo systemctl status mcp-weather-server
  sudo journalctl -u mcp-weather-server -f
  ```

## 🔧 Résolution de problèmes

### Le serveur ne démarre pas
- Vérifiez que le port 8080 n'est pas déjà utilisé : `lsof -i :8080`
- Vérifiez les permissions sur le répertoire du projet
- Assurez-vous que Node.js est installé : `node --version`

### Claude ne trouve pas les outils
- Redémarrez Claude Desktop après avoir modifié la configuration
- Vérifiez que le chemin `cwd` dans la configuration est correct
- Vérifiez que le projet est construit : `ls build/index.js`

### Erreurs de connexion
- Assurez-vous que le serveur MCP est démarré
- Vérifiez l'URL de santé : `curl http://localhost:8080/health`
- Vérifiez les logs du serveur pour des erreurs

## 📚 Exemples d'utilisation dans Claude

Une fois configuré, vous pouvez utiliser des commandes naturelles comme :

- "Trouve moi les coordonnées de Toulouse"
- "Quelle est la météo à Lyon ?"
- "Cherche toutes les villes qui commencent par 'Saint' dans nos données"
- "Démarre un suivi météo pour Nice avec des mises à jour toutes les minutes"

Le serveur MCP fera automatiquement la différence entre les recherches en ligne (via l'API Open-Meteo) et les recherches locales (dans les fichiers CSV).