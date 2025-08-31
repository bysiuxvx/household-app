# Use Node.js LTS
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./

# Copy backend package files
COPY package.json pnpm-lock.yaml ./apps/backend/

# Create shared directory structure
RUN mkdir -p ./node_modules

# Install all dependencies without freezing lockfile
RUN pnpm install --no-frozen-lockfile

# Set working directory to backend
WORKDIR /app/apps/backend

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN pnpm prisma generate

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "dist/server.js"]
