import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import axios from 'axios';
// MCP Server
function createMCPServer() {
    const server = new McpServer({
        name: 'weather-mcp-server',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
            logging: {}
        },
    });
    // Tool to get weather data
    server.tool('get_weather', 'Get current weather information for a location', {
        latitude: z.number().describe('Latitude of the location'),
        longitude: z.number().describe('Longitude of the location'),
        location_name: z.string().optional().describe('Optional name of the location for display')
    }, async ({ latitude, longitude, location_name }) => {
        try {
            const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`);
            const weather = response.data;
            const locationDisplay = location_name || `${latitude}, ${longitude}`;
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            location: locationDisplay,
                            weather: weather,
                            lastUpdate: new Date().toISOString()
                        }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error fetching weather data: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }
    });
    // Tool to stream weather data
    server.tool('stream_weather', 'Stream weather updates for a location with periodic updates', {
        latitude: z.number().describe('Latitude of the location'),
        longitude: z.number().describe('Longitude of the location'),
        location_name: z.string().optional().describe('Optional name of the location for display'),
        interval_seconds: z.number().default(60).describe('Update interval in seconds (default: 60)')
    }, async ({ latitude, longitude, location_name, interval_seconds }) => {
        const locationDisplay = location_name || `${latitude}, ${longitude}`;
        return {
            content: [
                {
                    type: 'text',
                    text: `Starting weather stream for ${locationDisplay} with ${interval_seconds}s interval...`
                }
            ]
        };
    });
    // Tool to search for GPS position of a city
    server.tool('search_location', 'Search for GPS coordinates of a city or location by name', {
        city_name: z.string().describe('Name of the city or location to search for'),
        country: z.string().optional().describe('Optional country name to narrow the search'),
        limit: z.number().min(1).max(10).default(5).describe('Maximum number of results to return (default: 5)')
    }, async ({ city_name, country, limit }) => {
        try {
            // Build search URL with Open-Meteo geocoding API
            const searchParams = new URLSearchParams({
                name: city_name,
                count: limit.toString(),
                language: 'fr',
                format: 'json'
            });
            if (country) {
                searchParams.append('country', country);
            }
            const response = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?${searchParams.toString()}`);
            const results = response.data.results || [];
            if (results.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No location found for "${city_name}"${country ? ` in ${country}` : ''}`
                        }
                    ]
                };
            }
            // Format results
            const locations = results.map((result) => ({
                name: result.name,
                country: result.country,
                admin1: result.admin1,
                latitude: result.latitude,
                longitude: result.longitude,
                timezone: result.timezone,
                population: result.population,
                elevation: result.elevation
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            query: city_name,
                            country_filter: country,
                            total_results: results.length,
                            locations: locations
                        }, null, 2)
                    }
                ]
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for location: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }
                ],
                isError: true
            };
        }
    });
    return server;
}
// Express Configuration
const app = express();
app.use(express.json());
app.use(cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id']
}));
// Storage for transports by session ID
const transports = {};
// Main MCP endpoint
app.all('/mcp', async (req, res) => {
    console.log(`Received ${req.method} request to /mcp`);
    try {
        const sessionId = req.headers['mcp-session-id'];
        let transport;
        if (sessionId && transports[sessionId]) {
            // Reuse existing transport
            transport = transports[sessionId];
        }
        else if (!sessionId && isInitializeRequest(req.body)) {
            // New initialization request
            transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sessionId) => {
                    console.log(`Session initialized with ID: ${sessionId}`);
                    transports[sessionId] = transport;
                }
            });
            // Cleanup configuration
            transport.onclose = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                    console.log(`Transport closed for session ${sid}`);
                    delete transports[sid];
                }
            };
            // Connect MCP server
            const mcpServer = createMCPServer();
            await mcpServer.connect(transport);
        }
        else {
            // Invalid request
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided'
                },
                id: null
            });
            return;
        }
        // Handle request with transport
        await transport.handleRequest(req, res, req.body);
    }
    catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
});
// Health route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Server startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
    if (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
    console.log(`Weather MCP Server listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    process.exit(0);
});
//# sourceMappingURL=index.js.map