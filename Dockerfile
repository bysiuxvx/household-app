# Use Node.js LTS with Alpine for smaller image size
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm and set up environment
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Install dependencies only when needed
FROM base AS deps

# Copy package files first to leverage Docker cache
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile --prod=false

# Rebuild the source code
FROM base AS builder
WORKDIR /app

# Copy pnpm and package files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/package.json ./

# Copy only necessary files for build
COPY .eslintrc.js ./
COPY .prettierrc ./
COPY tsconfig.base.json ./
COPY apps/backend/ ./apps/backend/
COPY packages/shared/ ./packages/shared/

# Build the app and generate Prisma client
RUN pnpm --filter backend build && \
    pnpm --filter backend exec prisma generate

# Production image
FROM base AS runner
WORKDIR /app

# Install production dependencies only
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built app
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

# Start the server
CMD ["node", "dist/server.js"]
