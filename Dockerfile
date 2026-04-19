# ---- Base ----
FROM node:20-alpine AS base

# ---- Dependencies ----
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Provide a dummy DATABASE_URL so `prisma generate` succeeds at build time.
# Prisma generate only reads the provider (postgresql) — it does NOT connect.
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm ci

# ---- Builder ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy the generated Prisma client (output lives in src/generated/prisma, not node_modules)
COPY --from=deps /app/src/generated ./src/generated

# Again, provide dummy URL for the Next.js build step (prisma client is already generated)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permissions for Next.js cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy prisma generated client
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# DATABASE_URL will be provided at runtime by Railway
CMD ["node", "server.js"]
