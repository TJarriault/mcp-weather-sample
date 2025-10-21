#!/usr/bin/env node

// Test simple de la fonction search_location
const http = require('node:http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testSearchLocation() {
  try {
    console.log('🔍 Test de la fonction search_location...\n');
    
    // 1. Initialisation MCP
    console.log('1. Initialisation MCP...');
    const initRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'test-search-client', version: '1.0.0' }
      }
    });
    
    const initResponse = await makeRequest({
      hostname: 'localhost',
      port: 8081,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      }
    }, initRequest);
    
    const sessionId = initResponse.headers['mcp-session-id'];
    console.log('✅ Session ID:', sessionId);
    
    // 2. Liste des outils
    console.log('\n2. Liste des outils...');
    const listToolsRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });
    
    const toolsResponse = await makeRequest({
      hostname: 'localhost',
      port: 8081,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      }
    }, listToolsRequest);
    
    console.log('📋 Outils disponibles:');
    const tools = JSON.parse(toolsResponse.data);
    if (tools.result && tools.result.tools) {
      tools.result.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
    }
    
    // 3. Test search_location pour Paris
    console.log('\n3. Recherche de Paris...');
    const searchParisRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_location',
        arguments: {
          city_name: 'Paris',
          limit: 3
        }
      }
    });
    
    const parisResponse = await makeRequest({
      hostname: 'localhost',
      port: 8081,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      }
    }, searchParisRequest);
    
    console.log('🗼 Résultats pour Paris:');
    const parisData = JSON.parse(parisResponse.data);
    if (parisData.result && parisData.result.content) {
      console.log(parisData.result.content[0].text);
    }
    
    // 4. Test search_location pour Lyon en France
    console.log('\n4. Recherche de Lyon en France...');
    const searchLyonRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'search_location',
        arguments: {
          city_name: 'Lyon',
          country: 'France',
          limit: 2
        }
      }
    });
    
    const lyonResponse = await makeRequest({
      hostname: 'localhost',
      port: 8081,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      }
    }, searchLyonRequest);
    
    console.log('🏛️ Résultats pour Lyon, France:');
    const lyonData = JSON.parse(lyonResponse.data);
    if (lyonData.result && lyonData.result.content) {
      console.log(lyonData.result.content[0].text);
    }
    
    console.log('\n✅ Tests terminés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testSearchLocation();