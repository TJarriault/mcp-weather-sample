import axios from 'axios';

/**
 * Test de validation de la configuration HTTP pour Claude Desktop
 * Ce script teste tous les outils MCP via HTTP pour s'assurer
 * qu'ils fonctionnent correctement avec la configuration Claude.
 */

const MCP_URL = 'http://localhost:3001/mcp';

class MCPHTTPTester {
    constructor() {
        this.sessionId = null;
        this.requestId = 1;
    }

    // Initialisation de la session MCP
    async initialize() {
        console.log('🚀 Initialisation de la session MCP...');
        
        try {
            const response = await axios.post(MCP_URL, {
                jsonrpc: '2.0',
                id: this.requestId++,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    clientInfo: { name: 'claude-http-tester', version: '1.0.0' }
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream'
                }
            });

            this.sessionId = response.headers['mcp-session-id'];
            console.log(`✅ Session initialisée: ${this.sessionId}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error.message);
            return false;
        }
    }

    // Appel générique d'un outil MCP
    async callTool(toolName, arguments) {
        if (!this.sessionId) {
            throw new Error('Session non initialisée');
        }

        const response = await axios.post(MCP_URL, {
            jsonrpc: '2.0',
            id: this.requestId++,
            method: 'tools/call',
            params: { name: toolName, arguments: arguments }
        }, {
            headers: {
                'Mcp-Session-Id': this.sessionId,
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            }
        });

        if (response.data.error) {
            throw new Error(`MCP Error: ${response.data.error.message}`);
        }

        return response.data.result;
    }

    // Test de l'outil search_local_cities
    async testSearchLocalCities() {
        console.log('\n🏙️ Test: search_local_cities');
        
        try {
            // Test 1: Recherche partielle
            console.log('  📍 Recherche partielle "Par"...');
            const result1 = await this.callTool('search_local_cities', {
                city_name: 'Par',
                exact_match: false,
                limit: 3
            });
            
            const data1 = JSON.parse(result1.content[0].text);
            console.log(`    ✅ Trouvé ${data1.results_returned} villes`);
            
            // Test 2: Recherche exacte
            console.log('  📍 Recherche exacte "Paris"...');
            const result2 = await this.callTool('search_local_cities', {
                city_name: 'Paris',
                exact_match: true,
                limit: 1
            });
            
            const data2 = JSON.parse(result2.content[0].text);
            console.log(`    ✅ Résultat exact: ${data2.cities[0]?.name || 'Non trouvé'}`);
            
            return true;
        } catch (error) {
            console.error('    ❌ Erreur:', error.message);
            return false;
        }
    }

    // Test de l'outil search_location
    async testSearchLocation() {
        console.log('\n🔍 Test: search_location');
        
        try {
            const result = await this.callTool('search_location', {
                city_name: 'Lyon',
                country: 'France',
                limit: 1
            });
            
            const data = JSON.parse(result.content[0].text);
            console.log(`  ✅ Trouvé: ${data.locations[0]?.name || 'Non trouvé'}`);
            return true;
        } catch (error) {
            console.error('  ❌ Erreur:', error.message);
            return false;
        }
    }

    // Test de l'outil get_weather
    async testGetWeather() {
        console.log('\n🌤️ Test: get_weather');
        
        try {
            const result = await this.callTool('get_weather', {
                latitude: 48.8566,
                longitude: 2.3522,
                location_name: 'Paris'
            });
            
            const data = JSON.parse(result.content[0].text);
            console.log(`  ✅ Météo pour ${data.location}: ${data.weather.current_weather.temperature}°C`);
            return true;
        } catch (error) {
            console.error('  ❌ Erreur:', error.message);
            return false;
        }
    }

    // Test de l'outil stream_weather
    async testStreamWeather() {
        console.log('\n📡 Test: stream_weather');
        
        try {
            const result = await this.callTool('stream_weather', {
                latitude: 43.2965,
                longitude: 5.3698,
                location_name: 'Marseille',
                interval_seconds: 30
            });
            
            console.log(`  ✅ Stream configuré: ${result.content[0].text}`);
            return true;
        } catch (error) {
            console.error('  ❌ Erreur:', error.message);
            return false;
        }
    }

    // Test de santé du serveur
    async testServerHealth() {
        console.log('\n🏥 Test de santé du serveur...');
        
        try {
            const response = await axios.get('http://localhost:3001/health');
            console.log(`  ✅ Serveur en bonne santé: ${response.data.status}`);
            return true;
        } catch (error) {
            console.error('  ❌ Serveur inaccessible:', error.message);
            return false;
        }
    }

    // Exécution de tous les tests
    async runAllTests() {
        console.log('🧪 Test de validation Claude HTTP Configuration');
        console.log('===============================================');

        const results = {
            health: await this.testServerHealth(),
            init: false,
            search_local_cities: false,
            search_location: false,
            get_weather: false,
            stream_weather: false
        };

        if (results.health) {
            results.init = await this.initialize();
            
            if (results.init) {
                results.search_local_cities = await this.testSearchLocalCities();
                results.search_location = await this.testSearchLocation();
                results.get_weather = await this.testGetWeather();
                results.stream_weather = await this.testStreamWeather();
            }
        }

        // Résumé
        console.log('\n📊 Résumé des tests:');
        console.log('====================');
        
        Object.entries(results).forEach(([test, success]) => {
            const status = success ? '✅' : '❌';
            console.log(`${status} ${test}`);
        });

        const successCount = Object.values(results).filter(Boolean).length;
        const totalTests = Object.keys(results).length;
        
        console.log(`\n🎯 Score: ${successCount}/${totalTests} tests réussis`);
        
        if (successCount === totalTests) {
            console.log('🎉 Tous les tests sont passés ! Votre configuration Claude HTTP est prête.');
        } else {
            console.log('⚠️  Certains tests ont échoué. Vérifiez la configuration et les logs du serveur.');
        }

        return successCount === totalTests;
    }
}

// Utilisation avec gestion des erreurs globales
async function main() {
    const tester = new MCPHTTPTester();
    
    try {
        const success = await tester.runAllTests();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('💥 Erreur critique:', error.message);
        process.exit(1);
    }
}

// Point d'entrée
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}