FROM node:24.11.1-alpine AS base

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
RUN apk add --no-cache libc6-compat
RUN apk update

# Set pnpm home and path
ENV PNPM_HOME=/app/.pnpm
ENV PATH=$PNPM_HOME:$PATH

# Set working directory
WORKDIR /app
RUN pnpm add turbo --global
COPY . .
RUN turbo prune @rectangular-labs/api-user-vm --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
# for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++ libstdc++
RUN apk update

# Set pnpm home and path
ENV PNPM_HOME=/app/.pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .

# Install deps
RUN pnpm install 

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm run build

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 user-vm
RUN adduser --system --uid 1001 user-vm
USER user-vm
COPY --from=installer /app .

EXPOSE 3999
CMD ["node", "packages/api-user-vm/dist/index.js"]