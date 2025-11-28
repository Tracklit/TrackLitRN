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
COPY attached_assets ./attached_assets
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Build client with Vite
# This creates: dist/public/ (Vite client build)
RUN npm run build

# Build server with esbuild
# This creates: dist/index.js (esbuild server bundle)
RUN npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile=dist/index.js \
  --external:@node-rs/argon2 \
  --external:@node-rs/bcrypt \
  --external:pg-native \
  --packages=external

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets from builder (includes both client and server)
COPY --from=builder /app/dist ./dist

# Copy shared code
COPY shared ./shared

# Copy attached_assets if needed at runtime  
COPY attached_assets ./attached_assets

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application - use esbuild bundle
CMD ["node", "dist/index.js"]
