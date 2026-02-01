# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## Quality Bar (Required)

After creating or modifying code, run typecheck, lint, and format as needed:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm format`

## Quick Start

- Install deps: `pnpm install`
- Start DB: `docker compose up -d`
- Initialize schema: `pnpm db:push`
- Run dev: `pnpm dev` (HTTPS, accept certs) and visit `https://localhost:6969`

## Common Commands

- `pnpm dev` - Start development server (requires Docker for PostgreSQL)
- `pnpm build` - Build all packages and apps
- `pnpm build:preview` - Build with preview environment (uses `.env`)
- `pnpm build:production` - Build for production (uses `.env.production`)
- `pnpm lint` - Run Biome linting across all workspaces
- `pnpm typecheck` - Run TypeScript type checking across all workspaces
- `pnpm format` - Format code using Biome
- `pnpm check` - Run Biome check with auto-fix

## Database Commands

- `pnpm db:push` - Push schema changes to local database (force)
- `pnpm db:mg` - Generate migration files (local env)
- `pnpm db:mp:local` - Apply migrations to local database
- `pnpm db:mp:preview` - Apply migrations to preview database
- `pnpm db:mp:production` - Apply migrations to production database
- `pnpm db:studio` - Open Drizzle Studio

## Environment Management

Environment variables are encrypted using dotenvx:

- `.env.production` - Production builds
- `.env` - Local development and preview builds
- `.env.local` - Local-only settings (git-ignored)

Set variables with: `pnpm env:set <VARIABLE_NAME> <VALUE>`  
Use `-f` to target a specific env file: `pnpm env:set <VAR> <VALUE> -f .env.local`

## Repository Layout

This is a TypeScript monorepo using Turborepo:

### Apps

- `apps/www` - Main web app (TanStack Start, Vite dev server on 6969).
- `apps/seo` - SEO product app (TanStack Start + Cloudflare Workers).
- `apps/seo-www` - Marketing site for SEO app.

### Packages

- `packages/api-core` - Shared oRPC handlers, CORS, OpenAPI wiring.
- `packages/api-seo` - SEO oRPC API routes, context, workflows, and handlers.
- `packages/api-user-vm` - User VM service + OpenAPI client/container exports.
- `packages/auth` - Auth server/client + UI components (better-auth).
- `packages/content` - Content collections, RSS/search helpers, content UI.
- `packages/core` - Shared utilities/integrations (e.g. Octokit/Shopify helpers).
- `packages/dataforseo` - DataForSEO API client + env/types.
- `packages/db` - Drizzle ORM client, schemas, and operations.
- `packages/emails` - Unified email client.
- `packages/google-apis` - Google Search Console client.
- `packages/loro-file-system` - Loro CRDT filesystem wrapper.
- `packages/result` - Result type helpers (`ok`/`err`/`safe`).
- `packages/task` - Trigger.dev jobs/tasks (crawler/AI workflows).
- `packages/ui` - Shared UI components, hooks, and styles.

### Tooling

- `tooling/typescript` - Shared TS configs.
- `tooling/github` - GitHub Actions setup/utility actions.

## Code Conventions

- React hooks must be at component top level.
- Avoid enums; prefer union types.
- Do not use `as any` or casting generally. Prefer `satisfies` or explicit types.
- When using the database object, prefer `.query` over `.select().from()`.
- Create DB helpers in `packages/db/src/operations` and consume those helpers from API/routes or apps.

## Key Architecture Patterns

### Routing (Apps)

- TanStack Start file-based routes live under `apps/*/src/routes`.
- Use `_` prefixed folders for layout/auth groups (e.g. `_authed`).
- Use `$` for route params (e.g. `$organizationSlug`).
- Collocate UI in `-components`, hooks in `-hooks`, and helpers in `-lib`.
- `routeTree.gen.ts` is generated and used by `apps/*/src/router.tsx`.

### API (oRPC + ArkType)

- API routes are in `packages/api-seo/src/routes` and composed in `packages/api-seo/src/routes/index.ts`.
- Use `base`, `protectedBase`, and `withOrganizationIdBase` from `packages/api-seo/src/context.ts` for middleware and auth.
- Input/output validation uses ArkType plus DB schemas from `packages/db/src/schema`.
- OpenAPI and RPC handlers come from `packages/api-core` (`createRpcHandler`, `createOpenAPIHandler`).

### Data Access

- DB schemas live in `packages/db/src/schema` using `drizzle-arktype` for insert/select/update schemas.
- Create query helpers in `packages/db/src/operations/**` and export from `packages/db/src/operations/index.ts`.
- Operations typically return `Result` (`ok`/`err`/`safe`) from `@rectangular-labs/result`.
- API routes call operations and translate failures into `ORPCError`s.

### App ↔ API Integration

- Client helpers live in `apps/seo/src/lib/api.ts`, using oRPC client + TanStack Query utils.
- Server-side requests use `serverClient` from `@rectangular-labs/api-seo/server` with request headers.

## Testing

- Root Vitest config is `vitest.config.ts`.
- App tests: `apps/seo/**/*.test.{ts,tsx}` (jsdom).
- Package tests run via `pnpm run --filter <package-name> test`.

## Environments & Deploy

- Env is managed by dotenvx (`pnpm env:set`, `.env`, `.env.local`, `.env.production`).
- Apps use Cloudflare Workers + Wrangler; `pnpm dev` decrypts env into app `.env.local`.
- CI runs Biome, typecheck, and tests; deploys go through Cloudflare workflows.

## Domain Context

- `strategy-architecture.md` documents the Strategy-first model and related DB/UI changes.
- Create DB helpers in `packages/db/src/operations` and consume those helpers from API/routes or apps as relevant.

## Package Generation

Preferred for AI/non-interactive: use `--args` to bypass prompts.

- Argument order: `name`, `type`, `features`
- Features: comma-separated list from `docs`, `env`, `react`, `styles`
- Use empty string `""` for no features

Examples:

```bash
pnpm new:package --args "my-lib" "public" ""
pnpm new:package --args "my-lib" "public" "docs"
pnpm new:package --args "my-private-lib" "private" "docs,env,react,styles"
pnpm new:package --args "my-svc" "private" "env"
pnpm new:package --args "my-svc" "private" "env,react"
```

Behavior:

- Public packages get `tsup.config.ts`; private do not.
- Dependencies are normalized to latest (workspace deps remain `workspace:*`).
- After scaffolding, install, format, and lint run automatically.
