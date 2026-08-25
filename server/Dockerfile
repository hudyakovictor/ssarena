# ============================================================
# SIGNAL ARENA — PRODUCTION DOCKERFILE
# Stateless API server, horizontally scalable
# ============================================================
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production --legacy-peer-deps

# Copy source
COPY src/ ./src/

# Create data directory
RUN mkdir -p /app/src/data

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Run
CMD ["node", "src/index.js"]
