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

check the root level package.json for the list of supported commands

## Environment Management

Environment variables are encrypted using dotenvx:

- `.env.production` - Production builds
- `.env` - Local development and preview builds
- `.env.local` - Local-only settings (git-ignored)

Set variables with: `pnpm env:set <VARIABLE_NAME> <VALUE>`  
Use `-f` to target a specific env file: `pnpm env:set <VAR> <VALUE> -f .env.local`

## Code Conventions

- React hooks must be at component top level.
- Use kebab-case for file names (including hook files).
- Avoid enums; prefer union types.
- Do not use `as any` or casting generally. Prefer `satisfies` or explicit types.
- Do not duplicate generic formatting helpers (numbers, dates, percent, currency, string casing) inside feature files; add/reuse them in `packages/core/src/format` and import from there.
- When combining ArkType schemas, prefer attached shapes (e.g. `type({ "...": otherSchema })`) over `.merge()`.
- For AI tool definitions, define schemas inline with `jsonSchema<...>()` directly inside the tool object and inline the TypeScript type in that generic; avoid separate ArkType schema references for tool input/output schema wiring.
- When using the database object, prefer `.query` over `.select().from()`.
- Create DB helpers in `packages/db/src/operations` and consume those helpers from API/routes or apps.
- Avoid god components that own unrelated queries.
- Parent/child component contract:
  - Parent components should own orchestration concerns: route-level composition, open/close state, identity/context inputs (for example organization/project/entity ids), and wiring between independent features.
  - Child feature components should own implementation concerns: local form state, validation, and query/mutation logic when behavior is stable across consumers.
  - Shared/reusable child UI components should stay data-driven/dumb with explicit props and minimal side effects.
  - Only expose callback props from child to parent when a real customization need exists (for example custom post-success navigation). Do not pass callback props preemptively.
  - Avoid explicit `mode` props when mode can be derived from data presence (for example entity exists vs null/undefined).
  - Unless a piece of code is needed to be used elsewhere do not export it out of the file by default.

## Key Architecture Patterns

### Routing (Apps)

- TanStack Start file-based routes live under `apps/*/src/routes`.
- Use `_` prefixed folders for layout/auth groups (e.g. `_authed`).
- Use `$` for route params (e.g. `$organizationSlug`).
- Collocate UI in `-components`, hooks in `-hooks`, and helpers in `-lib`.
- `routeTree.gen.ts` is generated and used by `apps/*/src/router.tsx`.
- Use `type[]` instead of `Array<type>`.

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
- Create DB helpers in `packages/db/src/operations` and consume those helpers from API/routes or apps as relevant.

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

## Mind Map of full application

We maintain a mind map of the full application in `MIND_MAP.md`.

Always make sure that we have an up to date MIND_MAP.md file that documents the current state of the project. 

Refer to MIND_MAP_CORE.md on how to create and maintain the mind map.
