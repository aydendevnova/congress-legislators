# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code and data files
COPY src/ ./src/
COPY congress-legislators/ ./congress-legislators/

# Verify kansas.csv exists in build stage
RUN ls -la src/kansas/
RUN cat src/kansas/kansas.csv | head -n 1

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/congress-legislators ./congress-legislators

# Create the kansas directory in dist and copy the CSV file
RUN mkdir -p ./dist/kansas
COPY --from=builder /app/src/kansas/kansas.csv ./dist/kansas/

COPY package*.json ./

# Verify kansas.csv exists in final image
RUN ls -la dist/kansas/
RUN cat dist/kansas/kansas.csv | head -n 1

# Create .env file if it doesn't exist
RUN touch .env

# Set default environment variables (these can be overridden at runtime)
ENV PORT=8787
ENV KEY=""
ENV CENSUS_API_KEY=""
ENV CUSTOM_API_KEY=""
ENV NODE_ENV=production

# Expose the port
EXPOSE 8787

# Start the application
CMD ["npm", "start"] 