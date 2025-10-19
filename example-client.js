// Exemple de client MCP pour tester le serveur météo
// Usage: node example-client.js

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const SERVER_URL = 'http://localhost:8080/mcp';

async function testWeatherMCP() {
  console.log('🌤️  Démarrage du test du serveur MCP météo...\n');

  try {
    // Créer le client MCP
    const client = new Client({
      name: 'weather-test-client',
      version: '1.0.0'
    });

    // Configurer la gestion d'erreurs
    client.onerror = (error) => {
      console.error('❌ Erreur client:', error);
    };

    // Créer le transport HTTP streamable
    const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL));
    
    console.log('🔗 Connexion au serveur MCP...');
    await client.connect(transport);
    console.log('✅ Connexion établie !\n');

    // Lister les outils disponibles
    console.log('📋 Récupération des outils disponibles...');
    const tools = await client.request(
      { method: 'tools/list', params: {} },
      { type: 'object', properties: { tools: { type: 'array' } } }
    );
    
    console.log('🛠️  Outils disponibles:');
    tools.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Test de l'outil search_location
    console.log('🔍 Test de search_location pour chercher Lyon...');
    const searchLyon = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'search_location',
          arguments: {
            city_name: 'Lyon',
            country: 'France',
            limit: 3
          }
        }
      },
      { type: 'object', properties: { content: { type: 'array' } } }
    );

    console.log('📍 Résultats de recherche pour Lyon:');
    console.log(searchLyon.content[0].text);
    console.log();

    // Test de l'outil get_weather pour Paris
    console.log('🌍 Test de get_weather pour Paris...');
    const parisWeather = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'get_weather',
          arguments: {
            latitude: 48.8566,
            longitude: 2.3522,
            location_name: 'Paris'
          }
        }
      },
      { type: 'object', properties: { content: { type: 'array' } } }
    );

    console.log('🌤️  Météo à Paris:');
    console.log(parisWeather.content[0].text);
    console.log();

    // Test de l'outil get_weather pour Tokyo
    console.log('🗾 Test de get_weather pour Tokyo...');
    const tokyoWeather = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'get_weather',
          arguments: {
            latitude: 35.6762,
            longitude: 139.6503,
            location_name: 'Tokyo'
          }
        }
      },
      { type: 'object', properties: { content: { type: 'array' } } }
    );

    console.log('🌸 Météo à Tokyo:');
    console.log(tokyoWeather.content[0].text);
    console.log();

    // Test de l'outil stream_weather
    console.log('📡 Test de stream_weather pour New York...');
    const streamWeather = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'stream_weather',
          arguments: {
            latitude: 40.7128,
            longitude: -74.0060,
            location_name: 'New York',
            interval_seconds: 30
          }
        }
      },
      { type: 'object', properties: { content: { type: 'array' } } }
    );

    console.log('🗽 Stream météo New York:');
    console.log(streamWeather.content[0].text);
    console.log();

    // Fermer la connexion
    console.log('🔚 Fermeture de la connexion...');
    await client.close();
    console.log('✅ Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('💡 Assurez-vous que le serveur MCP est démarré sur le port 8080');
    process.exit(1);
  }
}

// Fonction utilitaire pour afficher l'aide
function showUsage() {
  console.log(`
🌤️  Client de test MCP Weather Server

Usage: node example-client.js

Prérequis:
  1. Le serveur MCP doit être démarré:
     PORT=8080 npm start
     
  2. Le serveur doit être accessible sur:
     ${SERVER_URL}

Ce script va tester:
  - La connexion au serveur MCP
  - La liste des outils disponibles  
  - L'outil get_weather avec différentes villes
  - L'outil stream_weather

Example de démarrage du serveur:
  cd /appli/sogeti/devfest-mcp-a2a/mcp-weather
  PORT=8080 npm start
`);
}

// Vérifier les arguments de ligne de commande
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Exécuter les tests
testWeatherMCP().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});