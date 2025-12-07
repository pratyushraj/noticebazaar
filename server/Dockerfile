# Dockerfile for NoticeBazaar API Server
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files first (for better caching)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN pnpm run build

# Expose port (Fly.io uses 8080)
EXPOSE 8080

# Start server
CMD ["node", "dist/index.js"]

