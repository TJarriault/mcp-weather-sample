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
function getToolSpecificHelp(toolName: string): string | null {
  switch (toolName) {
    case 'search_location':
      return `🔍 **search_location** - GPS coordinates search using Open-Meteo API

**Description:**
Find GPS coordinates, timezone, population, and elevation data for cities worldwide.

**Parameters:**
• city_name (required): Name of city/location to search
• country (optional): Country name to narrow search  
• limit (optional): Max results (1-10, default: 5)

**Examples:**
\`\`\`json
{ "city_name": "Paris" }
{ "city_name": "Paris", "country": "France" }
{ "city_name": "Springfield", "limit": 3 }
{ "city_name": "San Francisco", "country": "United States", "limit": 5 }
\`\`\`

**Response includes:**
• Name, country, administrative division
• Latitude/longitude coordinates
• Timezone information  
• Population (if available)
• Elevation above sea level

**Use cases:**
• Get coordinates for weather API calls
• Find timezone information
• Discover cities with similar names
• Geographic data lookup`;

    case 'search_local_cities':
      return `🏙️ **search_local_cities** - French cities local database search

**Description:**
Search through local CSV database of French cities with detailed information.

**Parameters:**
• city_name (required): City name to search for
• exact_match (optional): true for exact match, false for partial (default: false)
• limit (optional): Max results (1-50, default: 10)

**Examples:**
\`\`\`json
{ "city_name": "Lyon" }
{ "city_name": "Saint", "limit": 20 }
{ "city_name": "Marseille", "exact_match": true }
{ "city_name": "Mont", "exact_match": false, "limit": 15 }
\`\`\`

**Search behavior:**
• Case-insensitive matching
• Partial matching finds cities containing the search term
• Exact matching finds cities with the exact name

**Use cases:**
• Find French cities quickly without API calls
• Discover cities with common prefixes
• Get local data for French locations
• Offline city lookup`;

    case 'help':
      return `❓ **help** - Get usage information and examples

**Description:**
Provides general help or specific tool documentation.

**Parameters:**
• tool_name (optional): Specific tool to get help for

**Examples:**
\`\`\`json
{ }
{ "tool_name": "search_location" }
{ "tool_name": "search_local_cities" }
\`\`\``;

    default:
      return null;
  }
}

function createMcpServer() {
  const server = new McpServer({
    name: "weather-mcp-server",
    version: "1.0.0"
  });

  // List all available tools with brief descriptions
  server.tool(
    'list_tools',
    'List all available tools with their descriptions and basic usage',
    {},
    async () => {
      return {
        content: [{
          type: 'text',
          text: `🛠️ Available Tools:

1. **search_location** - Find GPS coordinates using Open-Meteo API
   • Global city/location search
   • Returns coordinates, timezone, population data

2. **search_local_cities** - Search French cities in local database  
   • Fast offline search
   • Detailed French city information

3. **help** - Get detailed help and examples
   • General usage guide
   • Tool-specific documentation

4. **list_tools** - List all available tools (this tool)
   • Quick overview of capabilities
   • Brief descriptions

💡 Use the 'help' tool with a specific tool_name for detailed examples and documentation.`
        }]
      };
    }
  );
  server.tool(
    'help',
    'Get help and examples for using the weather MCP server tools',
    {
      tool_name: z.string().optional().describe('Specific tool name to get detailed help for (optional - leave empty for general help)')
    },
    async ({ tool_name }) => {
      if (tool_name) {
        const toolHelp = getToolSpecificHelp(tool_name);
        if (toolHelp) {
          return {
            content: [{
              type: 'text',
              text: toolHelp
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Tool '${tool_name}' not found. Available tools: search_location, search_local_cities, help`
            }]
          };
        }
      }

      return {
        content: [{
          type: 'text',
          text: `🌤️ Weather MCP Server - Available Tools:

🔍 **search_location** - Find GPS coordinates using Open-Meteo API
   Examples:
   • { "city_name": "Paris" }
   • { "city_name": "New York", "country": "United States" }
   • { "city_name": "London", "limit": 3 }

🏙️ **search_local_cities** - Search French cities in local database
   Examples:
   • { "city_name": "Lyon" }
   • { "city_name": "Saint", "limit": 20 }
   • { "city_name": "Marseille", "exact_match": true }

❓ **help** - Get this help information
   Examples:
   • { } - General help
   • { "tool_name": "search_location" } - Specific tool help

💡 **Tips:**
   - Use partial matching for broader results
   - Specify country for more accurate location searches
   - Adjust limit parameter to control number of results
   - All searches are case-insensitive

🌍 **Data Sources:**
   - Location search: Open-Meteo Geocoding API
   - Local cities: French cities CSV database`
        }]
      };
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
    `Search for GPS coordinates of a city or location by name using Open-Meteo geocoding API.
    
Examples:
- Search for Paris: { "city_name": "Paris" }
- Search for Paris in France specifically: { "city_name": "Paris", "country": "France" }
- Get multiple results: { "city_name": "Springfield", "limit": 3 }
- Search in a specific country: { "city_name": "London", "country": "United Kingdom", "limit": 5 }`,
    {
      city_name: z.string().describe('Name of the city or location to search for (e.g., "Paris", "New York", "Tokyo")'),
      country: z.string().optional().describe('Optional country name to narrow the search (e.g., "France", "United States", "Japan")'),
      limit: z.number().min(1).max(10).default(5).describe('Maximum number of results to return (default: 5, max: 10)')
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
                text: `No location found for "${city_name}"` + (country ? ` in ${country}` : '')
              }
            ]
          };
        }

        // Format results with better presentation
        const formattedResults = results.map((result: any, index: number) => 
          `${index + 1}. **${result.name}** (${result.country})
   📍 Coordinates: ${result.latitude}°, ${result.longitude}°
   🌍 Admin: ${result.admin1 || 'N/A'}
   ⏰ Timezone: ${result.timezone}
   👥 Population: ${result.population ? result.population.toLocaleString() : 'N/A'}
   🏔️ Elevation: ${result.elevation || 'N/A'}m`
        ).join('\n\n');

        const locationText = `🔍 Found ${results.length} location(s) for "${city_name}"` + (country ? ` in ${country}` : '') + ':';

        return {
          content: [
            {
              type: 'text',
              text: `${locationText}

${formattedResults}

📊 **Summary:**
• Query: "${city_name}"
• Country filter: ${country || 'None'}
• Results: ${results.length}/${limit}

💡 **Tip:** Use these coordinates with weather APIs or mapping services.`
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
    `Search for cities in the local CSV files from the static directory. Useful for finding French cities and their details.
    
Examples:
- Find all cities containing "Paris": { "city_name": "Paris" }
- Exact match for Lyon: { "city_name": "Lyon", "exact_match": true }
- Get top 20 cities containing "Saint": { "city_name": "Saint", "limit": 20 }
- Find cities starting with "Mar": { "city_name": "Mar", "exact_match": false, "limit": 15 }`,
    {
      city_name: z.string().describe('Name of the city to search for (case insensitive partial match, e.g., "Paris", "Lyon", "Marseille")'),
      exact_match: z.boolean().default(false).describe('Whether to search for exact match or partial match (default: false for partial matching)'),
      limit: z.number().min(1).max(50).default(10).describe('Maximum number of results to return (default: 10, max: 50)')
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

        // Format results with better presentation
        const formattedCities = limitedResults.map((city, index) => 
          `${index + 1}. **${city.ville}**
   📍 Coordinates: ${city.latitude}°, ${city.longitude}°`
        ).join('\n\n');

        const searchType = exact_match ? 'exact match' : 'partial match';
        const totalFound = filteredCities.length;
        const moreAvailable = totalFound > limitedResults.length;

        const tipText = moreAvailable ? `💡 **Tip:** Increase the 'limit' parameter to see more results.` : '';

        return {
          content: [
            {
              type: 'text',
              text: `🏙️ Found ${totalFound} French cities (${searchType}) for "${city_name}":

${formattedCities}

📊 **Summary:**
• Query: "${city_name}" 
• Search mode: ${searchType}
• Total found: ${totalFound}
• Shown: ${limitedResults.length}${moreAvailable ? ` (${totalFound - limitedResults.length} more available)` : ''}
• Data source: Local CSV files

${tipText}`
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
      const mcpServer = createMcpServer();
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