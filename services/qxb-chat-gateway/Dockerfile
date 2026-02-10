FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/qxb-chat-gateway/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY services/qxb-chat-gateway/src ./src
COPY packages ./packages

FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app ./

# Expose port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8090/health || exit 1

# Run the service
CMD ["node", "src/index.js"]
