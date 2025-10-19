#!/bin/bash

echo "🧪 Test de la fonctionnalité de recherche dans les villes locales"
echo "=================================================="

# Démarrer le serveur en arrière-plan
echo "🚀 Démarrage du serveur MCP..."
npm start &
SERVER_PID=$!

# Attendre que le serveur démarre
echo "⏳ Attente du démarrage du serveur..."
sleep 3

# Vérifier que le serveur est démarré
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Serveur démarré avec succès"
    
    # Exécuter les tests
    echo "🧪 Exécution des tests..."
    node test_local_cities.js
    
    echo "🏁 Tests terminés"
else
    echo "❌ Erreur: Le serveur n'a pas pu démarrer"
fi

# Arrêter le serveur
echo "🛑 Arrêt du serveur..."
kill $SERVER_PID 2>/dev/null || true

echo "✅ Terminé !"