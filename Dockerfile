# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=optional

# Install platform-specific native binaries for Alpine Linux  
RUN npm install --force @rollup/rollup-linux-x64-musl
RUN npm install --force --platform=linuxmusl --arch=x64 sharp

# Copy source code
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Build client with Vite
# This creates: dist/public/ (Vite client build)
RUN npm run build

# Build server with esbuild
# This creates: dist/index.js (esbuild server bundle)
# Mark vite as external so it doesn't get bundled
RUN npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile=dist/index.js \
  --external:@node-rs/argon2 \
  --external:@node-rs/bcrypt \
  --external:pg-native \
  --external:./vite.js \
  --external:vite \
  --packages=external

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init bash

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Install sharp with correct platform binary
RUN npm install --platform=linuxmusl --arch=x64 sharp

# Copy built assets from builder (includes both client and server)
COPY --from=builder /app/dist ./dist

# Copy server source files (needed for external imports like vite.ts in dev mode)
COPY --from=builder /app/server ./server

# Copy shared code
COPY shared ./shared

# Copy SQL migrations (for in-container DB migrations)
COPY migrations ./migrations

# Copy attached_assets if needed at runtime  

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start via entrypoint script (supports optional SQL migrations)
CMD ["sh", "./docker-entrypoint.sh"]

