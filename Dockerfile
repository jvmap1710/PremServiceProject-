FROM node:22-alpine AS base
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Install dependencies only when needed
FROM base AS deps
RUN sed -i 's/https/http/g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --loglevel=error --no-audit --no-fund

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

# Dummy env vars required at build time for Next.js page data collection.
# These are NOT used at runtime — real values come from docker-compose.yml.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV AUTH_SECRET="build-time-dummy-secret"
ENV NEXTAUTH_URL="http://localhost:9999"

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built assets and standalone server
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 9999

ENV PORT=9999
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx prisma db push && node server.js"]
