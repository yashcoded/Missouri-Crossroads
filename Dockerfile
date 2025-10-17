# Missouri Crossroads - Docker Configuration
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN npm install -g pnpm@10

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for build-time environment variables (public only)
ARG NEXT_PUBLIC_AWS_REGION
ARG NEXT_PUBLIC_COGNITO_USER_POOL_ID
ARG NEXT_PUBLIC_COGNITO_CLIENT_ID
ARG NEXT_PUBLIC_DYNAMODB_USERS_TABLE
ARG NEXT_PUBLIC_DYNAMODB_NOTES_TABLE
ARG NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE
ARG NEXT_PUBLIC_MAP_KEY
ARG NEXT_PUBLIC_PLACES_KEY

# Set environment variables for build
ENV NEXT_PUBLIC_AWS_REGION=$NEXT_PUBLIC_AWS_REGION \
    NEXT_PUBLIC_COGNITO_USER_POOL_ID=$NEXT_PUBLIC_COGNITO_USER_POOL_ID \
    NEXT_PUBLIC_COGNITO_CLIENT_ID=$NEXT_PUBLIC_COGNITO_CLIENT_ID \
    NEXT_PUBLIC_DYNAMODB_USERS_TABLE=$NEXT_PUBLIC_DYNAMODB_USERS_TABLE \
    NEXT_PUBLIC_DYNAMODB_NOTES_TABLE=$NEXT_PUBLIC_DYNAMODB_NOTES_TABLE \
    NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE=$NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE \
    NEXT_PUBLIC_MAP_KEY=$NEXT_PUBLIC_MAP_KEY \
    NEXT_PUBLIC_PLACES_KEY=$NEXT_PUBLIC_PLACES_KEY

# Build Next.js app
RUN pnpm build

# Stage 3: Production runner
FROM node:20-alpine AS runner
RUN npm install -g pnpm@10

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/map/csv-data', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["pnpm", "start"]

