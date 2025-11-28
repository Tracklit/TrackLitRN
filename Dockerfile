# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Build the client
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server
COPY shared ./shared

# Create startup script
RUN echo 'import { register } from "node:module";' > server.mjs && \
    echo 'import { pathToFileURL } from "node:url";' >> server.mjs && \
    echo '' >> server.mjs && \
    echo 'register("tsx", pathToFileURL("./"));' >> server.mjs && \
    echo '' >> server.mjs && \
    echo 'process.env.NODE_ENV = process.env.NODE_ENV || "production";' >> server.mjs && \
    echo '' >> server.mjs && \
    echo 'import("./server/index.ts").catch(err => {' >> server.mjs && \
    echo '  console.error("Failed to start server:", err);' >> server.mjs && \
    echo '  process.exit(1);' >> server.mjs && \
    echo '});' >> server.mjs

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.mjs"]
