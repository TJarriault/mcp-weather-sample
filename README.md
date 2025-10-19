# MCP Weather Server

A streamable HTTP MCP (Model Context Protocol) server for getting weather data via the Open-Meteo API.

## 🚀 Features

- **Streamable HTTP Transport**: Compatible with MCP 2025-03-26 specification
- **Session Management**: Support for persistent sessions with unique IDs
- **Weather Tools**: Three main tools for geolocation and weather data
- **REST API**: Health endpoint for monitoring

## 📦 Installation

```bash
# Clone and install dependencies
npm install

# Compile TypeScript
npm run build

# Start the server
npm start
```

## 🔧 Configuration

The server uses the following environment variables:

- `PORT`: Listening port (default: 3000)

Example:
```bash
PORT=8080 npm start
```

## 🛠️ Available MCP Tools

### 1. `search_location`

Search for GPS coordinates of a city or location by name.

**Parameters:**

- `city_name` (string): Name of the city or location to search for
- `country` (string, optional): Country name to narrow the search
- `limit` (number, optional): Maximum number of results to return (default: 5, max: 10)

**Example response:**
```json
{
  "query": "Paris",
  "country_filter": null,
  "total_results": 5,
  "locations": [
    {
      "name": "Paris",
      "country": "France",
      "admin1": "Île-de-France",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "timezone": "Europe/Paris",
      "population": 2161000,
      "elevation": 42
    },
    {
      "name": "Paris",
      "country": "United States",
      "admin1": "Texas",
      "latitude": 33.6609,
      "longitude": -95.5555,
      "timezone": "America/Chicago",
      "population": 25171,
      "elevation": 177
    }
  ]
}
```

### 2. `get_weather`

Get current weather information for a location.

**Parameters:**

- `latitude` (number): Latitude in decimal degrees (-90 to 90)
- `longitude` (number): Longitude in decimal degrees (-180 to 180)  
- `location_name` (string, optional): Optional location name for display

**Example response:**
```json
{
  "location": "Paris",
  "weather": {
    "current_weather": {
      "temperature": 15.2,
      "windspeed": 10.5,
      "winddirection": 230,
      "weathercode": 1,
      "is_day": 1,
      "time": "2024-01-15T14:00"
    },
    "current_units": {
      "temperature": "°C",
      "windspeed": "km/h",
      "winddirection": "°",
      "weathercode": "wmo code",
      "is_day": "",
      "time": "iso8601"
    }
  },
  "lastUpdate": "2024-01-15T14:05:30.123Z"
}
```

### 3. `stream_weather`

Start streaming weather data with periodic updates.

**Parameters:**

- `latitude` (number): Latitude in decimal degrees (-90 to 90)
- `longitude` (number): Longitude in decimal degrees (-180 to 180)
- `location_name` (string, optional): Optional location name for display
- `interval_seconds` (number, default: 60): Update interval in seconds

## 🌐 HTTP Endpoints

### Server Health

```http
GET /health
```

Returns server status:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T14:05:30.123Z"
}
```

### MCP Endpoint

```http
POST /mcp
GET /mcp  
DELETE /mcp
```

Main endpoint for MCP communications. Supports:
- `POST`: Initialization and request sending
- `GET`: SSE stream establishment for responses
- `DELETE`: Session termination

## 📋 Usage Example with MCP Client

### 1. Session Initialization

```javascript
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: { tools: {} },
    clientInfo: { name: 'weather-client', version: '1.0.0' }
  }
};

const response = await fetch('http://localhost:8080/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  },
  body: JSON.stringify(initRequest)
});

const sessionId = response.headers.get('mcp-session-id');
```

### 2. List Available Tools

```javascript
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
};

const response = await fetch('http://localhost:8080/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'mcp-session-id': sessionId
  },
  body: JSON.stringify(listToolsRequest)
});
```

### 3. Call Weather Tool

```javascript
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

const response = await fetch('http://localhost:8080/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'mcp-session-id': sessionId
  },
  body: JSON.stringify(weatherRequest)
});
```

## 🧪 Testing

To test the server:

```bash
# Start the server
PORT=8080 npm start

# In another terminal, test the health endpoint
curl http://localhost:8080/health
```

## 🔍 Using MCP Inspector

You can use the official MCP Inspector to visually explore and test your weather server tools in a user-friendly interface.

### Installation and Setup

1. **Install MCP Inspector** (requires Node.js):

   ```bash
   npx @modelcontextprotocol/inspector
   ```

2. **Start your weather server**:

   ```bash
   PORT=8080 npm start
   ```

3. **Configure MCP Inspector**:
   - Server URL: `http://localhost:8080/mcp`
   - Transport: `HTTP (Streamable)`
   - Protocol Version: `2024-11-05`

### Visual Interface Features

![MCP Inspector Example](img/inspector.png)

The MCP Inspector provides:

- **🛠️ Tools Explorer**: Browse all available tools (`search_location`, `get_weather`, `stream_weather`)
- **📝 Interactive Forms**: Easy-to-use forms for entering tool parameters
- **🎯 Real-time Testing**: Execute tools and see live responses
- **📊 Response Viewer**: JSON-formatted results with syntax highlighting
- **🔄 Session Management**: Visual session state and connection status
- **📈 Request/Response History**: Track all your API interactions

### Example Workflow

1. **Connect** to your server using the Inspector
2. **Explore** the three available weather tools
3. **Test location search**:
   - Tool: `search_location`
   - Parameters: `city_name: "Paris"`
4. **Get weather data**:
   - Tool: `get_weather`
   - Parameters: Use coordinates from previous search
5. **Monitor streaming**:
   - Tool: `stream_weather`
   - Watch real-time weather updates

### Benefits

- **No coding required**: Test your MCP server without writing client code
- **Visual debugging**: See exactly what data flows between client and server
- **Tool validation**: Verify parameter schemas and response formats
- **Rapid prototyping**: Quickly iterate on your MCP server implementation

The Inspector is particularly useful during development to ensure your weather server works correctly before integrating it into larger applications.

## 🏗️ Architecture

- **Express.js**: HTTP server
- **MCP SDK**: MCP protocol implementation with StreamableHTTPServerTransport
- **Open-Meteo API**: Weather data source
- **TypeScript**: Development language with compilation to JavaScript

## 📄 Specifications

- **MCP Protocol**: Version 2024-11-05 and 2025-03-26
- **Transport**: Streamable HTTP with SSE support
- **Data Format**: JSON-RPC 2.0
- **Weather API**: [Open-Meteo](https://open-meteo.com/)

## 🔗 Useful Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## 📝 License

This project is a demonstration example based on open-meteo-mcp.
