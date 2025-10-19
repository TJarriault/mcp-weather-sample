# Configuration HTTP pour Claude Desktop - Guide Détaillé

## 📋 Vue d'ensemble

La configuration HTTP (`claude_config_http.json`) permet à Claude Desktop de se connecter à votre serveur MCP Weather via HTTP plutôt qu'en lançant directement le processus Node.js. Cette approche présente plusieurs avantages :

- ✅ **Serveur persistant** : Le serveur peut tourner en continu
- ✅ **Serveur distant** : Possibilité d'héberger le serveur sur une autre machine
- ✅ **Monitoring** : Facilite la surveillance et les logs
- ✅ **Scaling** : Permet le load balancing et la haute disponibilité

## 🔧 Structure de la configuration

```json
{
  "mcpServers": {
    "weather-mcp-server-http": {
      // Configuration détaillée ci-dessous
    }
  }
}
```

## 📖 Explication section par section

### 1. Métadonnées du serveur

```json
"weather-mcp-server-http": {
  "description": "Serveur MCP météo accessible via HTTP"
}
```

- **`weather-mcp-server-http`** : Identifiant unique du serveur MCP
- **`description`** : Description lisible du serveur

### 2. Configuration du transport HTTP

```json
"transport": {
  "type": "http",
  "url": "http://localhost:8080/mcp",
  "headers": {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream"
  }
}
```

#### Détails :
- **`type: "http"`** : Spécifie l'utilisation du transport HTTP
- **`url`** : Point d'entrée de votre serveur MCP
  - `localhost:8080` : Adresse et port du serveur
  - `/mcp` : Endpoint MCP configuré dans Express
- **`headers`** : Headers HTTP requis
  - `Content-Type: application/json` : Format des données envoyées
  - `Accept: application/json, text/event-stream` : Formats acceptés en réponse

### 3. Capacités du serveur

```json
"capabilities": [
  "tools"
]
```

Déclare que ce serveur fournit des outils utilisables par Claude.

### 4. Définition des outils

Chaque outil est décrit avec ses paramètres :

#### 🌤️ **get_weather**
```json
{
  "name": "get_weather",
  "description": "Obtenir la météo actuelle pour des coordonnées GPS",
  "parameters": {
    "latitude": { "type": "number", "description": "Latitude du lieu" },
    "longitude": { "type": "number", "description": "Longitude du lieu" },
    "location_name": { "type": "string", "description": "Nom optionnel du lieu" }
  }
}
```

#### 🔍 **search_location**
```json
{
  "name": "search_location",
  "description": "Rechercher les coordonnées GPS d'une ville",
  "parameters": {
    "city_name": { "type": "string", "description": "Nom de la ville" },
    "country": { "type": "string", "description": "Pays optionnel" },
    "limit": { "type": "number", "description": "Nombre max de résultats" }
  }
}
```

#### 🏙️ **search_local_cities** (Nouvel outil)
```json
{
  "name": "search_local_cities",
  "description": "Rechercher dans les villes du fichier CSV local",
  "parameters": {
    "city_name": { "type": "string", "description": "Nom de la ville (recherche partielle)" },
    "exact_match": { "type": "boolean", "description": "Recherche exacte ou partielle" },
    "limit": { "type": "number", "description": "Nombre max de résultats" }
  }
}
```

#### 📡 **stream_weather**
```json
{
  "name": "stream_weather",
  "description": "Diffuser les mises à jour météo périodiques",
  "parameters": {
    "latitude": { "type": "number", "description": "Latitude" },
    "longitude": { "type": "number", "description": "Longitude" },
    "location_name": { "type": "string", "description": "Nom optionnel" },
    "interval_seconds": { "type": "number", "description": "Intervalle en secondes" }
  }
}
```

### 5. Options de fiabilité

```json
"timeout": 30000,
"retries": 3
```

- **`timeout`** : Délai d'attente en millisecondes (30 secondes)
- **`retries`** : Nombre de tentatives en cas d'échec

## 🚀 Mise en place

### Étape 1 : Démarrer le serveur MCP

Le serveur doit être démarré **avant** Claude Desktop :

```bash
cd mcp-weather-sample
npm start
```

Vérifiez que le serveur fonctionne :
```bash
curl http://localhost:8080/health
# Réponse attendue : {"status":"OK","timestamp":"..."}
```

### Étape 2 : Configurer Claude Desktop

Copiez le contenu de `claude_config_http.json` dans votre configuration Claude :

**Linux/macOS :**
```bash
~/.config/claude-desktop/claude_desktop_config.json
```

**Windows :**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### Étape 3 : Adapter l'URL si nécessaire

Si votre serveur fonctionne sur un autre port ou une autre machine :

```json
"url": "http://votre-serveur:PORT/mcp"
```

Exemples :
- Serveur local sur port 8080 : `"http://localhost:8080/mcp"`
- Serveur distant : `"http://192.168.1.100:8080/mcp"`
- Serveur avec domaine : `"https://weather-mcp.mondomaine.com/mcp"`

### Étape 4 : Redémarrer Claude Desktop

Fermez et relancez Claude Desktop pour charger la nouvelle configuration.

## 🔧 Configuration avancée

### Pour un serveur HTTPS

```json
"transport": {
  "type": "http",
  "url": "https://weather-mcp.mondomaine.com/mcp",
  "headers": {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "Authorization": "Bearer YOUR_API_TOKEN"
  }
}
```

### Avec authentification

```json
"headers": {
  "Content-Type": "application/json",
  "Accept": "application/json, text/event-stream",
  "Authorization": "Bearer YOUR_TOKEN",
  "X-API-Key": "YOUR_API_KEY"
}
```

### Timeout personnalisé

```json
"timeout": 60000,  // 1 minute
"retries": 5       // 5 tentatives
```

## 🐛 Résolution de problèmes

### Erreur de connexion
```
Error: connect ECONNREFUSED
```
**Solutions :**
1. Vérifiez que le serveur MCP est démarré
2. Vérifiez l'URL dans la configuration
3. Testez manuellement : `curl http://localhost:8080/health`

### Timeout
```
Error: Request timeout
```
**Solutions :**
1. Augmentez le timeout dans la configuration
2. Vérifiez la performance du serveur
3. Optimisez les requêtes lentes

### Headers incorrects
```
Error: Not Acceptable
```
**Solutions :**
1. Vérifiez les headers `Content-Type` et `Accept`
2. Assurez-vous qu'ils correspondent aux attentes du serveur

## 📊 Monitoring et logs

### Côté serveur
```bash
# Logs en temps réel
tail -f /var/log/mcp-weather-server.log

# Status si service systemd
sudo systemctl status mcp-weather-server
```

### Côté Claude Desktop
Les logs de Claude Desktop affichent les interactions avec le serveur MCP.

## 🆚 HTTP vs Command : Quand utiliser quoi ?

### Utilisez HTTP quand :
- ✅ Le serveur doit être persistant
- ✅ Vous voulez héberger sur une machine distante
- ✅ Vous avez besoin de monitoring avancé
- ✅ Plusieurs clients Claude doivent partager le serveur

### Utilisez Command quand :
- ✅ Configuration simple et locale
- ✅ Pas besoin de persistence
- ✅ Un seul utilisateur Claude
- ✅ Gestion automatique du cycle de vie

## 🔗 Liens utiles

- [Documentation MCP officielle](https://docs.anthropic.com/claude/docs/model-context-protocol)
- [Guide configuration Claude Desktop](https://docs.anthropic.com/claude/docs/claude-desktop)
- [Express.js documentation](https://expressjs.com/)

Cette configuration HTTP vous donne une flexibilité maximale pour déployer et gérer votre serveur MCP Weather ! 🚀
