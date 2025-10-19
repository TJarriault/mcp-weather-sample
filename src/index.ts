import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import axios from 'axios';
import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

// Interfaces
interface WeatherData {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
    time: string;
  };
  current_units: {
    temperature: string;
    windspeed: string;
    winddirection: string;
    weathercode: string;
    is_day: string;
    time: string;
  };
}

interface CityData {
  ville: string;
  longitude: number;
  latitude: number;
}

// Utility functions
function parseCSV(csvContent: string): CityData[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(';');
  
  return lines.slice(1).map(line => {
    const values = line.split(';');
    const city: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      if (header === 'longitude' || header === 'latitude') {
        city[header] = parseFloat(value);
      } else {
        city[header] = value;
      }
    });
    
    return city as CityData;
  });
}

function loadCitiesFromStatic(): CityData[] {
  const staticDir = join(process.cwd(), 'static');
  const cities: CityData[] = [];
  
  try {
    console.log('Loading cities from:', staticDir);
    const files = readdirSync(staticDir);
    const csvFiles = files.filter(file => extname(file).toLowerCase() === '.csv');
    console.log('Found CSV files:', csvFiles);
    
    csvFiles.forEach(file => {
      const filePath = join(staticDir, file);
      console.log('Reading file:', filePath);
      const content = readFileSync(filePath, 'utf-8');
      const parsedCities = parseCSV(content);
      console.log(`Loaded ${parsedCities.length} cities from ${file}`);
      cities.push(...parsedCities);
    });
  } catch (error) {
    console.error('Error loading cities from static directory:', error);
  }
  
  console.log(`Total cities loaded: ${cities.length}`);
  return cities;
}

// MCP Server
function createMCPServer() {
  const server = new McpServer(
    {
      name: 'weather-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        logging: {}
      },
    }
  );

  // Tool to get weather data
  server.tool(
    'get_weather',
    'Get current weather information for a location',
    {
      latitude: z.number().describe('Latitude of the location'),
      longitude: z.number().describe('Longitude of the location'),
      location_name: z.string().optional().describe('Optional name of the location for display')
    },
    async ({ latitude, longitude, location_name }) => {
      try {
        const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
        );
        
        const weather: WeatherData = response.data;
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
      } catch (error) {
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
    }
  );

  // Tool to stream weather data
  server.tool(
    'stream_weather',
    'Stream weather updates for a location with periodic updates',
    {
      latitude: z.number().describe('Latitude of the location'),
      longitude: z.number().describe('Longitude of the location'),
      location_name: z.string().optional().describe('Optional name of the location for display'),
      interval_seconds: z.number().default(60).describe('Update interval in seconds (default: 60)')
    },
    async ({ latitude, longitude, location_name, interval_seconds }) => {
      const locationDisplay = location_name || `${latitude}, ${longitude}`;
      
      return {
        content: [
          {
            type: 'text',
            text: `Starting weather stream for ${locationDisplay} with ${interval_seconds}s interval...`
          }
        ]
      };
    }
  );

  // Tool to search for GPS position of a city
  server.tool(
    'search_location',
    'Search for GPS coordinates of a city or location by name',
    {
      city_name: z.string().describe('Name of the city or location to search for'),
      country: z.string().optional().describe('Optional country name to narrow the search'),
      limit: z.number().min(1).max(10).default(5).describe('Maximum number of results to return (default: 5)')
    },
    async ({ city_name, country, limit }) => {
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

        const response = await axios.get(
          `https://geocoding-api.open-meteo.com/v1/search?${searchParams.toString()}`
        );

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
        const locations = results.map((result: any) => ({
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
      } catch (error) {
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
    }
  );

  // Tool to search for cities in local CSV files
  server.tool(
    'search_local_cities',
    'Search for cities in the local CSV files from the static directory',
    {
      city_name: z.string().describe('Name of the city to search for (case insensitive partial match)'),
      exact_match: z.boolean().default(false).describe('Whether to search for exact match or partial match (default: false)'),
      limit: z.number().min(1).max(50).default(10).describe('Maximum number of results to return (default: 10)')
    },
    async ({ city_name, exact_match, limit }) => {
      try {
        const cities = loadCitiesFromStatic();
        
        if (cities.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No cities found in local CSV files. Please check the static directory.'
              }
            ]
          };
        }

        // Search logic
        const searchTerm = city_name.toLowerCase().trim();
        let filteredCities: CityData[];

        if (exact_match) {
          filteredCities = cities.filter(city => 
            city.ville.toLowerCase() === searchTerm
          );
        } else {
          filteredCities = cities.filter(city => 
            city.ville.toLowerCase().includes(searchTerm)
          );
        }

        // Limit results
        const limitedResults = filteredCities.slice(0, limit);

        if (limitedResults.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No cities found matching "${city_name}" in local CSV files.`
              }
            ]
          };
        }

        // Format results
        const results = {
          query: city_name,
          exact_match: exact_match,
          total_found: filteredCities.length,
          results_returned: limitedResults.length,
          cities: limitedResults.map(city => ({
            name: city.ville,
            latitude: city.latitude,
            longitude: city.longitude
          }))
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching local cities: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        };
      }
    }
  );

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
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Main MCP endpoint
app.all('/mcp', async (req, res) => {
  console.log(`Received ${req.method} request to /mcp`);
  
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
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
    } else {
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
  } catch (error) {
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
const PORT = process.env.PORT || 3001;
app.listen(PORT, (error?: Error) => {
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