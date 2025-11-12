# 🌤️ Weather MCP Server - Usage Examples

Ce document fournit des exemples pratiques pour utiliser les outils du serveur MCP Weather.

## 🚀 Test Rapide avec cURL

### Prérequis

1. **Récupérer un token d'accès** (si authentification activée) :
```bash
export TOKEN=$(curl -k -s -X POST \
  -d "client_id=mcpweather-client" \
  -d "client_secret=HFLjyBhlfn2WgQZWVBZ5ASItetLL04iW" \
  -d "grant_type=client_credentials" \
  "https://keycloak.192.168.49.2.nip.io/realms/master/protocol/openid-connect/token" \
  | jq -r .access_token)
```

2. **URL du serveur** :
   - Avec auth : `https://weather-auth.192.168.49.2.nip.io`
   - Sans auth : `https://weather.192.168.49.2.nip.io`

### Template de Requête

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: test-session-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "TOOL_NAME",
      "arguments": {
        // PARAMETRES ICI
      }
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

## 🛠️ Outils Disponibles

### 1. `help` - Aide et Documentation

Obtenez de l'aide générale ou spécifique à un outil.

#### Exemples JSON
```json
// Aide générale
{}

// Aide pour un outil spécifique
{ "tool_name": "search_location" }
```

#### Commandes cURL

**Aide générale :**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: help-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "help",
      "arguments": {}
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

**Aide spécifique à un outil :**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: help-tool-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "help",
      "arguments": {
        "tool_name": "search_location"
      }
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

### 2. `list_tools` - Liste des Outils

Affichez rapidement tous les outils disponibles.

#### Exemple JSON
```json
{}
```

#### Commande cURL
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: list-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_tools",
      "arguments": {}
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

### 3. `search_location` - Recherche GPS avec Open-Meteo

Trouvez les coordonnées GPS, timezone et informations de villes dans le monde entier.

#### Exemples JSON

```json
// Recherche simple
{ "city_name": "Paris" }

// Recherche avec pays spécifique  
{ "city_name": "Paris", "country": "France" }

// Limiter le nombre de résultats
{ "city_name": "Springfield", "limit": 3 }
```

#### Commandes cURL

**Recherche simple de Paris :**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: search-paris-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_location",
      "arguments": {
        "city_name": "Paris"
      }
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

**Recherche avec pays spécifique :**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: search-paris-fr-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_location",
      "arguments": {
        "city_name": "Paris",
        "country": "France"
      }
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

**Recherche avec limite de résultats :**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: search-springfield-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_location",
      "arguments": {
        "city_name": "Springfield",
        "limit": 3
      }
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

#### Exemples Avancés

```json
// Villes avec des noms similaires
{ "city_name": "London", "limit": 5 }

// Recherche précise par pays
{ "city_name": "Birmingham", "country": "United Kingdom" }

// Recherche de petites villes
{ "city_name": "Annecy", "country": "France", "limit": 2 }
```

#### Cas d'Usage

- 🌍 **Géolocalisation** : Obtenir coordonnées pour APIs météo
- ⏰ **Fuseaux horaires** : Connaître le timezone d'une ville  
- 👥 **Démographie** : Information population des villes
- 🏔️ **Topographie** : Altitude des locations

### 4. `search_local_cities` - Base de Données Française

Recherchez rapidement dans la base locale de villes françaises.

#### Exemples JSON

```json
// Recherche simple (correspondance partielle)
{ "city_name": "Lyon" }

// Correspondance exacte
{ "city_name": "Lyon", "exact_match": true }

// Plus de résultats
{ "city_name": "Saint", "limit": 20 }
```

#### Commandes cURL

**Recherche simple de Lyon :**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: local-lyon-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_local_cities",
      "arguments": {
        "city_name": "Lyon"
      }
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

**Recherche exacte :**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: exact-lyon-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_local_cities",
      "arguments": {
        "city_name": "Lyon",
        "exact_match": true
      }
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

**Recherche avec plus de résultats :**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: saint-cities-$(date +%s)" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_local_cities",
      "arguments": {
        "city_name": "Saint",
        "limit": 20
      }
    }
  }' \
  https://weather-auth.192.168.49.2.nip.io/ -k
```

#### Exemples de Recherche Partielle

```json
// Toutes les villes contenant "Mont"
{ "city_name": "Mont", "limit": 15 }

// Villes avec préfixe "Saint-"
{ "city_name": "Saint-", "limit": 25 }

// Recherche par région (ex: villes de Bretagne)
{ "city_name": "Plou", "limit": 10 }
```

#### Exemples de Recherche Exacte

```json
// Marseille exactement
{ "city_name": "Marseille", "exact_match": true }

// Lyon exactement  
{ "city_name": "Lyon", "exact_match": true }

// Toulouse exactement
{ "city_name": "Toulouse", "exact_match": true }
```

#### Cas d'Usage

- 🇫🇷 **Géographie française** : Explorer les villes françaises
- 🚀 **Performance** : Recherche rapide hors ligne
- 📍 **Coordonnées locales** : Données précises pour la France
- 🔍 **Découverte** : Trouver villes par préfixe/suffixe

## 💡 Conseils d'Utilisation

### Optimisation des Recherches

1. **Utilisez des filtres pays** pour `search_location` quand possible
2. **Ajustez la limite** selon vos besoins (plus = plus lent)
3. **Commencez par une recherche large** puis affinez
4. **Utilisez la recherche exacte** quand vous connaissez le nom précis

### Gestion des Erreurs

- Vérifiez la réponse avant d'utiliser les données
- Les erreurs réseau peuvent affecter `search_location`  
- `search_local_cities` est plus fiable (données locales)

### Combinaison d'Outils

```json
// 1. Trouver une ville française rapidement
{ "city_name": "Nice", "exact_match": true }

// 2. Obtenir plus d'infos avec Open-Meteo  
{ "city_name": "Nice", "country": "France" }
```

## 🌟 Scénarios d'Usage Avancés

### Exploration Géographique

```json
// Découvrir toutes les "Saint-" en Bretagne
{ "city_name": "Saint-", "limit": 30 }

// Comparer différentes "Springfield" 
{ "city_name": "Springfield", "limit": 10 }

// Villes côtières françaises
{ "city_name": "sur-Mer", "limit": 20 }
```

### Intégration APIs

```json
// 1. Obtenir coordonnées pour API météo
{ "city_name": "Strasbourg", "country": "France" }

// 2. Utiliser lat/lon dans l'API météo
// Résultat: 48.5734°, 7.7521°
```

### Validation de Données

```json
// Vérifier orthographe exacte
{ "city_name": "Aix-en-Provence", "exact_match": true }

// Explorer variations
{ "city_name": "Aix", "limit": 5 }
```

## 📚 Ressources Supplémentaires

- **API Open-Meteo** : [https://open-meteo.com/](https://open-meteo.com/)
- **Documentation MCP** : Pour comprendre le protocole sous-jacent
- **Code source** : `src/index.ts` pour voir l'implémentation

---

💬 **Besoin d'aide ?** Utilisez l'outil `help` pour obtenir de l'assistance contextuelle !