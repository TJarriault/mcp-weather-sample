// Test script for MCP Weather Server
import fetch from 'node-fetch';

const MCP_ENDPOINT = 'http://localhost:8080/mcp';

async function testMCPServer() {
  try {
    console.log('Testing MCP Weather Server...');
    
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:8080/health');
    const healthData = await healthResponse.json();
    console.log('Health response:', healthData);
    
    // Test 2: Initialize MCP session
    console.log('\n2. Initializing MCP session...');
    const initRequest = {
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
    };
    
    const initResponse = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify(initRequest)
    });
    
    const sessionId = initResponse.headers.get('mcp-session-id');
    console.log('Session ID:', sessionId);
    console.log('Init response status:', initResponse.status);
    
    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('Init error:', errorText);
      return;
    }
    
    // Test 3: List tools
    console.log('\n3. Listing available tools...');
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    
    const toolsResponse = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      },
      body: JSON.stringify(listToolsRequest)
    });
    
    console.log('Tools response status:', toolsResponse.status);
    const toolsData = await toolsResponse.text();
    console.log('Tools response:', toolsData);
    
    // Test 4: Call weather tool
    console.log('\n4. Calling get_weather tool...');
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
    
    const weatherResponse = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': sessionId
      },
      body: JSON.stringify(weatherRequest)
    });
    
    console.log('Weather response status:', weatherResponse.status);
    const weatherData = await weatherResponse.text();
    console.log('Weather response:', weatherData);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testMCPServer();