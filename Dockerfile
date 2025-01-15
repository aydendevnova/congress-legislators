# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/

# Copy congress-legislators submodule
COPY congress-legislators/ ./congress-legislators/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/congress-legislators ./congress-legislators
COPY package*.json ./

# Expose port
EXPOSE 8787

# Start the server
CMD ["node", "dist/server.js"] 