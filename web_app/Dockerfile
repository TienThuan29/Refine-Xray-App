# Use Node.js 20 LTS as base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Development stage
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["npm", "run", "dev"]

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1

# Accept build arguments for Next.js public env vars
ARG NEXT_PUBLIC_HASHING_SECRET_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_XRAY_DETECTION_API
ARG NEXT_PUBLIC_GEMINI_API_KEY
ARG NEXT_PUBLIC_GEMINI_API_MODEL

# Make them available as environment variables during build
ENV NEXT_PUBLIC_HASHING_SECRET_KEY=${NEXT_PUBLIC_HASHING_SECRET_KEY}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_XRAY_DETECTION_API=${NEXT_PUBLIC_XRAY_DETECTION_API}
ENV NEXT_PUBLIC_GEMINI_API_KEY=${NEXT_PUBLIC_GEMINI_API_KEY}
ENV NEXT_PUBLIC_GEMINI_API_MODEL=${NEXT_PUBLIC_GEMINI_API_MODEL}

# Build Next.js application
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Set runtime environment variables for Next.js (needed for server-side rendering)
# These are also embedded at build time, but needed at runtime for SSR
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GEMINI_API_KEY
ARG NEXT_PUBLIC_GEMINI_API_MODEL
ARG NEXT_PUBLIC_XRAY_DETECTION_API

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_GEMINI_API_KEY=${NEXT_PUBLIC_GEMINI_API_KEY}
ENV NEXT_PUBLIC_GEMINI_API_MODEL=${NEXT_PUBLIC_GEMINI_API_MODEL}
ENV NEXT_PUBLIC_XRAY_DETECTION_API=${NEXT_PUBLIC_XRAY_DETECTION_API}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))" || exit 0

# Start the application
CMD ["node", "server.js"]

