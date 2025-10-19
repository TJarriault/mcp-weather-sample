import axios from 'axios';

const baseUrl = 'http://localhost:3002/mcp';
let sessionId = null;

async function initializeSession() {
    const response = await axios.post(baseUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            clientInfo: { name: 'test-client', version: '1.0.0' }
        }
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        }
    });
    
    sessionId = response.headers['mcp-session-id'];
    console.log(`✅ Session initialisée: ${sessionId}`);
}

async function testSearchLocalCities(cityName, exactMatch = false, limit = 5) {
    const response = await axios.post(baseUrl, {
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 1000),
        method: 'tools/call',
        params: {
            name: 'search_local_cities',
            arguments: { city_name: cityName, exact_match: exactMatch, limit: limit }
        }
    }, {
        headers: {
            'Mcp-Session-Id': sessionId,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        }
    });
    
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.result && response.data.result.content && response.data.result.content[0]) {
        return JSON.parse(response.data.result.content[0].text);
    } else {
        throw new Error('Invalid response structure: ' + JSON.stringify(response.data));
    }
}

async function runTests() {
    try {
        console.log('🚀 Initialisation...');
        await initializeSession();
        
        console.log('\n📍 Test 1: Recherche partielle "Par"');
        const result1 = await testSearchLocalCities('Par', false, 5);
        console.log(JSON.stringify(result1, null, 2));
        
        console.log('\n📍 Test 2: Recherche exacte "Paris"');
        const result2 = await testSearchLocalCities('Paris', true, 1);
        console.log(JSON.stringify(result2, null, 2));
        
        console.log('\n📍 Test 3: Recherche partielle "Saint"');
        const result3 = await testSearchLocalCities('Saint', false, 10);
        console.log(JSON.stringify(result3, null, 2));
        
        console.log('\n✅ Tests terminés avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

runTests();