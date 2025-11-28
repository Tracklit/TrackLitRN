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

# Build the client
RUN npm run build

# Compile TypeScript server to JavaScript
RUN npx tsc --project tsconfig.json --outDir dist/server-compiled --module es2022 --target es2022 --moduleResolution bundler

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

# Copy compiled server from builder
COPY --from=builder /app/dist/server-compiled ./dist/server-compiled

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

# Start the application - use compiled JavaScript
CMD ["node", "dist/server-compiled/server/index.js"]
