# Use Node.js LTS
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY ./apps/backend/package.json ./apps/backend/package.json
COPY ./packages/shared/package.json ./packages/shared/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Rebuild the source code
FROM base AS builder
WORKDIR /app

# Copy pnpm files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/package.json ./

# Copy app source
COPY . .

# Build the app
RUN pnpm --filter backend build

# Prisma generate
RUN pnpm --filter backend exec prisma generate

# Production image
FROM base AS runner
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy built app
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm

# Copy Prisma schema
COPY --from=builder /app/apps/backend/prisma ./prisma

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "dist/server.js"]
