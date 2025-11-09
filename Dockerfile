# Dockerfile for MCP Weather Sample
# Multi-stage build to optimize image size

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (dev + production)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy compiled files from builder stage
COPY --from=builder /app/build ./build

# Copy static files (CSV files)
COPY static/ ./static/

# Change file ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port configured for Kubernetes (8080)
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { hostname: 'localhost', port: process.env.PORT || 8080, path: '/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
      if (res.statusCode === 200) process.exit(0); else process.exit(1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.on('timeout', () => process.exit(1)); \
    req.end();"

# Startup command
CMD ["node", "build/index.js"]