# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
ARG NEXT_PUBLIC_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG CLIENT_AUTH_SECRET
ARG DATABASE_URL
ARG RESEND_API_KEY
ARG SEND_FROM_EMAIL
ARG RESEND_FROM_NAME
ARG XENDIT_SECRET_KEY
ARG XENDIT_CALLBACK_VERIFICATION_TOKEN
ARG CRON_API_KEY
ARG MINIO_ENDPOINT
ARG MINIO_PORT
ARG MINIO_USE_SSL
ARG MINIO_ACCESS_KEY
ARG MINIO_SECRET_KEY
ARG MINIO_BUCKET_NAME
ARG NEXT_TELEMETRY_DISABLED
ARG NEXT_PUBLIC_DISABLE_SIGNUP

ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
ENV CLIENT_AUTH_SECRET=${CLIENT_AUTH_SECRET}
ENV DATABASE_URL=${DATABASE_URL}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV RESEND_FROM_NAME=${RESEND_FROM_NAME}
ENV XENDIT_SECRET_KEY=${XENDIT_SECRET_KEY}
ENV XENDIT_CALLBACK_VERIFICATION_TOKEN=${XENDIT_CALLBACK_VERIFICATION_TOKEN}
ENV CRON_API_KEY=${CRON_API_KEY}
ENV MINIO_ENDPOINT=${MINIO_ENDPOINT}
ENV MINIO_PORT=${MINIO_PORT}
ENV MINIO_USE_SSL=${MINIO_USE_SSL}
ENV MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
ENV MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
ENV MINIO_BUCKET_NAME=${MINIO_BUCKET_NAME}
ENV NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED}
ENV NEXT_PUBLIC_DISABLE_SIGNUP=${NEXT_PUBLIC_DISABLE_SIGNUP}

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner

# Install pnpm and tsx for pre-deploy commands
RUN corepack enable pnpm && npm install -g tsx

WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy database migrations and config for drizzle-kit migrate
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db/migrations ./src/lib/db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy source files needed for drizzle-kit generate and push
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
# Copy TypeScript config for drizzle
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
# Copy all node_modules to run drizzle-kit commands
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy pnpm lock file for pnpm commands
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Ensure .env file can be created if needed by drizzle-kit
RUN mkdir -p /app && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]