import axios from 'axios';

async function testLocalCitiesSearch() {
    const baseUrl = 'http://localhost:3001/mcp';
    let sessionId = null;

    try {
        console.log('🚀 Initialisation de la session MCP...');
        
        // Initialisation
        const initResponse = await axios.post(baseUrl, {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {}
                },
                clientInfo: {
                    name: 'test-client',
                    version: '1.0.0'
                }
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream'
            }
        });

        sessionId = initResponse.headers['mcp-session-id'];
        console.log(`✅ Session initialisée avec l'ID: ${sessionId}`);

        // Test 1: Recherche partielle pour "Par"
        console.log('\n📍 Test 1: Recherche partielle pour "Par"');
        const searchResponse1 = await axios.post(baseUrl, {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'search_local_cities',
                arguments: {
                    city_name: 'Par',
                    exact_match: false,
                    limit: 5
                }
            }
        }, {
            headers: {
                'Mcp-Session-Id': sessionId
            }
        });

        console.log('Résultat:', JSON.stringify(searchResponse1.data.result.content[0].text, null, 2));

        // Test 2: Recherche exacte pour "Paris"
        console.log('\n📍 Test 2: Recherche exacte pour "Paris"');
        const searchResponse2 = await axios.post(baseUrl, {
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'search_local_cities',
                arguments: {
                    city_name: 'Paris',
                    exact_match: true,
                    limit: 5
                }
            }
        }, {
            headers: {
                'Mcp-Session-Id': sessionId
            }
        });

        console.log('Résultat:', JSON.stringify(searchResponse2.data.result.content[0].text, null, 2));

        // Test 3: Recherche partielle pour "Saint"
        console.log('\n📍 Test 3: Recherche partielle pour "Saint"');
        const searchResponse3 = await axios.post(baseUrl, {
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: {
                name: 'search_local_cities',
                arguments: {
                    city_name: 'Saint',
                    exact_match: false,
                    limit: 10
                }
            }
        }, {
            headers: {
                'Mcp-Session-Id': sessionId
            }
        });

        console.log('Résultat:', JSON.stringify(searchResponse3.data.result.content[0].text, null, 2));

        // Test 4: Recherche qui ne trouve rien
        console.log('\n📍 Test 4: Recherche qui ne trouve rien ("Tokyo")');
        const searchResponse4 = await axios.post(baseUrl, {
            jsonrpc: '2.0',
            id: 5,
            method: 'tools/call',
            params: {
                name: 'search_local_cities',
                arguments: {
                    city_name: 'Tokyo',
                    exact_match: false,
                    limit: 5
                }
            }
        }, {
            headers: {
                'Mcp-Session-Id': sessionId
            }
        });

        console.log('Résultat:', JSON.stringify(searchResponse4.data.result.content[0].text, null, 2));

        console.log('\n✅ Tous les tests terminés avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.response ? error.response.data : error.message);
    }
}

// Lancement des tests
console.log('🧪 Test de la fonctionnalité de recherche dans les villes locales');
console.log('⚠️  Assurez-vous que le serveur MCP est démarré sur le port 3001');
testLocalCitiesSearch();