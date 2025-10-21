#!/usr/bin/env node

// Simple test script for MCP Weather Server using curl-like commands
const http = require('http');

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

async function testServer() {
  try {
    console.log('Testing MCP Weather Server on port 8080...');
    
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/health',
      method: 'GET'
    });
    
    console.log('Health status:', healthResponse.statusCode);
    console.log('Health response:', healthResponse.data);
    
    // Test MCP initialization
    console.log('\n2. Testing MCP initialization...');
    const initRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });
    
    const mcpResponse = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      }
    }, initRequest);
    
    console.log('MCP status:', mcpResponse.statusCode);
    console.log('MCP headers:', mcpResponse.headers);
    console.log('MCP response:', mcpResponse.data);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testServer();