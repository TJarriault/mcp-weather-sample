# Configuration Claude - MCP Weather Sample

Ce dossier contient tous les fichiers de configuration pour l'intégration avec Claude Desktop et les outils de configuration associés.

## 📋 Fichiers de configuration

### Configurations Claude principales
- **`claude_config.json`** - Configuration de base pour Claude Desktop
- **`claude_config_detailed.json`** - Configuration détaillée avec options avancées
- **`claude_config_http.json`** - Configuration pour le serveur HTTP MCP

### Documentation
- **`CLAUDE_CONFIG_README.md`** - Guide complet de configuration Claude
- **`HTTP_CONFIG_GUIDE.md`** - Guide spécifique pour la configuration HTTP

### Scripts utilitaires
- **`install_claude_config.sh`** - Script d'installation automatique de la configuration
- **`validate_claude_http.sh`** - Script de validation de la configuration HTTP

## 🚀 Usage rapide

### Installation automatique
```bash
cd claude-configuration && ./install_claude_config.sh
```

### Validation de la configuration
```bash
cd claude-configuration && ./validate_claude_http.sh
```

### Configuration manuelle
1. Choisir le fichier de configuration approprié selon vos besoins
2. Copier le contenu dans la configuration Claude Desktop
3. Redémarrer Claude Desktop

## 📁 Structure

```
claude-configuration/
├── README.md                     # Ce fichier
├── claude_config.json            # Config de base
├── claude_config_detailed.json   # Config détaillée
├── claude_config_http.json       # Config HTTP
├── CLAUDE_CONFIG_README.md       # Guide détaillé
├── HTTP_CONFIG_GUIDE.md          # Guide HTTP
├── install_claude_config.sh      # Script d'installation
└── validate_claude_http.sh       # Script de validation
```

## 🔧 Types de configuration

### Configuration de base (`claude_config.json`)
- Configuration minimale pour démarrer
- Paramètres essentiels seulement
- Recommandée pour les débutants

### Configuration détaillée (`claude_config_detailed.json`)
- Toutes les options disponibles
- Commentaires explicatifs
- Paramètres avancés

### Configuration HTTP (`claude_config_http.json`)
- Spécifique pour le transport HTTP
- Configuration pour déploiement distant
- Support des sessions MCP

## 📖 Documentation

Consultez les guides détaillés :
- `CLAUDE_CONFIG_README.md` pour la configuration générale
- `HTTP_CONFIG_GUIDE.md` pour la configuration HTTP spécifique

## ⚠️ Notes importantes

- Sauvegardez votre configuration Claude existante avant installation
- Redémarrez Claude Desktop après chaque modification
- Vérifiez que le serveur MCP est démarré avant de tester
- Les scripts nécessitent les permissions d'exécution (`chmod +x`)