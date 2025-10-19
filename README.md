# MCP Weather Server

Un serveur MCP (Model Context Protocol) streamable HTTP pour obtenir des données météorologiques via l'API Open-Meteo.

## 🚀 Fonctionnalités

- **Transport HTTP Streamable** : Compatible avec la spécification MCP 2025-03-26
- **Gestion de sessions** : Support des sessions persistantes avec ID unique
- **Outils météo** : Trois outils principaux pour géolocalisation et données météorologiques
- **API REST** : Endpoint de santé pour monitoring

## 📦 Installation

```bash
# Cloner et installer les dépendances
npm install

# Compiler le TypeScript
npm run build

# Démarrer le serveur
npm start
```

## 🔧 Configuration

Le serveur utilise les variables d'environnement suivantes :

- `PORT` : Port d'écoute (défaut: 3000)

Exemple :
```bash
PORT=8080 npm start
```

## 🛠️ Outils MCP disponibles

### 1. `search_location`

Recherche la position GPS d'une ville ou localisation par son nom.

**Paramètres :**
- `city_name` (string) : Nom de la ville ou localisation à rechercher
- `country` (string, optionnel) : Nom du pays pour affiner la recherche
- `limit` (number, optionnel) : Nombre maximum de résultats à retourner (défaut: 5, max: 10)

**Exemple de réponse :**
```json
{
  "query": "Paris",
  "country_filter": null,
  "total_results": 5,
  "locations": [
    {
      "name": "Paris",
      "country": "France",
      "admin1": "Île-de-France",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "timezone": "Europe/Paris",
      "population": 2161000,
      "elevation": 42
    },
    {
      "name": "Paris",
      "country": "United States",
      "admin1": "Texas",
      "latitude": 33.6609,
      "longitude": -95.5555,
      "timezone": "America/Chicago",
      "population": 25171,
      "elevation": 177
    }
  ]
}
```

### 2. `get_weather`

Obtient les données météorologiques actuelles pour une localisation.

**Paramètres :**
- `latitude` (number) : Latitude en degrés décimaux (-90 à 90)
- `longitude` (number) : Longitude en degrés décimaux (-180 à 180)  
- `location_name` (string, optionnel) : Nom de la localisation pour affichage

**Exemple de réponse :**
```json
{
  "location": "Paris",
  "weather": {
    "current_weather": {
      "temperature": 15.2,
      "windspeed": 10.5,
      "winddirection": 230,
      "weathercode": 1,
      "is_day": 1,
      "time": "2024-01-15T14:00"
    },
    "current_units": {
      "temperature": "°C",
      "windspeed": "km/h",
      "winddirection": "°",
      "weathercode": "wmo code",
      "is_day": "",
      "time": "iso8601"
    }
  },
  "lastUpdate": "2024-01-15T14:05:30.123Z"
}
```

### 2. `stream_weather`

Démarre un streaming de données météorologiques avec des mises à jour périodiques.

**Paramètres :**
- `latitude` (number) : Latitude en degrés décimaux (-90 à 90)
- `longitude` (number) : Longitude en degrés décimaux (-180 à 180)
- `location_name` (string, optionnel) : Nom de la localisation pour affichage
- `interval_seconds` (number, défaut: 60) : Intervalle entre les mises à jour en secondes

## 🌐 Endpoints HTTP

### Santé du serveur
```
GET /health
```

Retourne l'état du serveur :
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T14:05:30.123Z"
}
```

### Endpoint MCP
```
POST /mcp
GET /mcp  
DELETE /mcp
```

L'endpoint principal pour les communications MCP. Supporte :
- `POST` : Initialisation et envoi de requêtes
- `GET` : Établissement du stream SSE pour les réponses
- `DELETE` : Terminaison de session

## 📋 Exemple d'utilisation avec un client MCP

### 1. Initialisation de session

```javascript
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {} },
    clientInfo: { name: 'weather-client', version: '1.0.0' }
  }
};

const response = await fetch('http://localhost:8080/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  },
  body: JSON.stringify(initRequest)
});

const sessionId = response.headers.get('mcp-session-id');
```

### 2. Lister les outils disponibles

```javascript
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
};

const response = await fetch('http://localhost:8080/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'mcp-session-id': sessionId
  },
  body: JSON.stringify(listToolsRequest)
});
```

### 3. Appeler l'outil météo

```javascript
const weatherRequest = {
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'get_weather',
    arguments: {
      latitude: 48.8566,
      longitude: 2.3522,
      location_name: 'Paris'
    }
  }
};

const response = await fetch('http://localhost:8080/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'mcp-session-id': sessionId
  },
  body: JSON.stringify(weatherRequest)
});
```

## 🧪 Tests

Pour tester le serveur :

```bash
# Démarrer le serveur
PORT=8080 npm start

# Dans un autre terminal, tester l'endpoint de santé
curl http://localhost:8080/health
```

## 🏗️ Architecture

- **Express.js** : Serveur HTTP
- **MCP SDK** : Implémentation du protocole MCP avec StreamableHTTPServerTransport
- **Open-Meteo API** : Source des données météorologiques
- **TypeScript** : Langage de développement avec compilation vers JavaScript

## 📄 Spécifications

- **Protocole MCP** : Version 2024-11-05 et 2025-03-26
- **Transport** : Streamable HTTP avec support SSE
- **Format de données** : JSON-RPC 2.0
- **API météo** : Open-Meteo (https://open-meteo.com/)

## 🔗 Liens utiles

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 📝 Licence

Ce projet est un exemple de démonstration basé sur open-meteo-mcp.