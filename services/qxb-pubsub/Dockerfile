FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY services/qxb-pubsub/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY services/qxb-pubsub/src ./src
COPY packages ./packages

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3004/health || exit 1

# Run the service
CMD ["node", "src/index.js"]
