# Scripts de Test - MCP Weather Sample

Ce dossier contient tous les scripts de test et de démonstration pour l'application MCP Weather Sample.

## 📋 Scripts disponibles

### Scripts de test Kubernetes
- **`test-k8s-deployment.sh`** - Script de test complet pour le déploiement Kubernetes
  - Test des pods, services, health check et endpoints MCP
  - Support pour test local (port-forward) et via ingress

### Scripts de test MCP
- **`test_mcp.js`** - Test principal de l'API MCP
- **`test_simple.js`** - Tests simples des fonctionnalités de base
- **`example-client.js`** - Client d'exemple pour démonstration

### Scripts de test des fonctionnalités météo
- **`test_local_cities.js`** - Test de recherche de villes locales (CSV)
- **`test_simple_local_cities.js`** - Version simplifiée du test de villes locales
- **`test_search_location.js`** - Test de recherche de coordonnées GPS

### Scripts de test Claude
- **`test_claude_http_config.js`** - Test de la configuration HTTP pour Claude

### Scripts shell utilitaires
- **`test_local_cities.sh`** - Script shell pour tester les villes locales
- **`test_search.sh`** - Script shell pour tester la recherche de lieux
- **`start.sh`** - Script de démarrage pour développement

## 🚀 Usage

### Test du déploiement Kubernetes
```bash
# Test local avec port-forward automatique
./test/test-k8s-deployment.sh

# Test via ingress avec domaine personnalisé
./test/test-k8s-deployment.sh ingress mon-domaine.com
```

### Tests des fonctionnalités MCP
```bash
# Test complet de l'API MCP
cd test && node test_mcp.js

# Test simple des fonctionnalités
cd test && node test_simple.js

# Test client d'exemple
cd test && node example-client.js
```

### Tests des fonctionnalités météo
```bash
# Test de recherche de villes locales
cd test && node test_local_cities.js

# Test de recherche de coordonnées
cd test && node test_search_location.js

# Via script shell
cd test && ./test_local_cities.sh
```

### Test de configuration Claude
```bash
cd test && node test_claude_http_config.js
```

## 📁 Structure

```
test/
├── README.md                      # Ce fichier
├── test-k8s-deployment.sh         # Tests Kubernetes
├── test_mcp.js                    # Tests MCP principaux
├── test_simple.js                 # Tests simples
├── example-client.js              # Client d'exemple
├── test_local_cities.js           # Tests villes locales
├── test_simple_local_cities.js    # Tests villes (version simple)
├── test_search_location.js        # Tests géolocalisation
├── test_claude_http_config.js     # Tests Claude
├── test_local_cities.sh           # Script shell villes
├── test_search.sh                 # Script shell recherche
└── start.sh                       # Script de démarrage dev
```

## 🔧 Prérequis

- Node.js installé pour les scripts `.js`
- curl pour les scripts shell et tests HTTP
- kubectl configuré pour les tests Kubernetes
- Application MCP Weather Sample démarrée (local ou K8s)

## 📝 Notes

- Assurez-vous que l'application est démarrée avant de lancer les tests
- Pour les tests Kubernetes, le cluster doit être accessible
- Les scripts shell nécessitent les permissions d'exécution (`chmod +x`)
- Certains tests peuvent nécessiter une configuration réseau spécifique