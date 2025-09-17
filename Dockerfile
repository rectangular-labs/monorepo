# Multi-stage Dockerfile to build and run the crawler actor
# - Uses Apify Playwright image (Chrome 1.55.0)
# - Builds using the monorepo provided as Docker build context
# - Uses pnpm
FROM apify/actor-node-playwright-chrome:22-1.55.0 AS base

###############################
# Builder - generates the appropriate Dockerfile for the crawler package
###############################
FROM base AS pruner

# Install pnpm without using npm -g
ENV PNPM_HOME=/home/myuser/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN wget -qO- https://get.pnpm.io/install.sh | SHELL="$(which bash)" bash -

RUN pnpm i -g turbo@2.5.6

WORKDIR /app
USER root
RUN chown -R myuser:myuser /app
USER myuser

COPY --chown=myuser . .
RUN pnpm turbo prune @rectangular-labs/crawler --docker

###############################
# Installer - installs the dependencies for the crawler package
###############################
FROM base AS builder

# Install pnpm without using npm -g
ENV PNPM_HOME=/home/myuser/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN wget -qO- https://get.pnpm.io/install.sh | SHELL="$(which bash)" bash -

# These are mostly from the `apify create` example to check things
# Check preinstalled packages
RUN npm ls crawlee apify puppeteer playwright
# Check Playwright version is the same as the one from base image.
RUN node check-playwright-version.mjs

WORKDIR /app
USER root
RUN chown -R myuser:myuser /app
USER myuser
# Avoid re-downloading Playwright browsers on install (already in base image)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1


# Copy only files needed for dependency resolution first (better layer caching)
COPY --chown=myuser --from=pruner /app/out/json/ .

# Install workspace dependencies
RUN pnpm i --frozen-lockfile

# Copy the full output
COPY --chown=myuser --from=pruner /app/out/full/ .

# Build just the crawler package
RUN pnpm run build

CMD cd packages/crawler && pnpm run start:prod


