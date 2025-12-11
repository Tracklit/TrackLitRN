#!/bin/bash

# Install ALL dependencies (including dev) for build
npm ci

# Build the frontend
npm run build

# Now remove dev dependencies to save space (optional)
# npm prune --production
