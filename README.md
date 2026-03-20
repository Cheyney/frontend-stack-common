# frontend-stack-common

Common starting template for React SPA frontends consuming OpenAPI 3.1 APIs.

## Stack

React 19.2 | Vite 8 | TypeScript 5.9 | Zod v4 | TanStack Router v1 | TanStack Query v5 | TanStack Table v8 | shadcn/ui v4 | Tailwind CSS 4 | orval 8 | react-hook-form 7 | Bun

## Prerequisites

- [Bun](https://bun.sh) (runtime + package manager)
- [Docker](https://docs.docker.com/get-docker/) (production build)
- [just](https://github.com/casey/just) (command runner)

## Quick start

```bash
git clone https://github.com/Cheyney/frontend-stack-common.git
cd frontend-stack-common
cp .env.example .env
bun install
just generate   # generates typed API client from OpenAPI spec
just dev         # starts Vite dev server with MSW mocks
```

## File structure

```
src/
  api/              # Generated API client (orval output -- do not edit)
  components/
    data-table/     # Reusable server-side data table with pagination
    ui/             # shadcn/ui primitives
  hooks/            # Shared React hooks
  lib/
    env.ts          # Zod-validated environment variables
    fetcher.ts      # Custom fetch mutator for orval (error handling)
    utils.ts        # cn() and other utilities
  mocks/
    browser.ts      # MSW service worker setup
  routes/
    items/          # Example resource: list, detail, create/edit dialogs
    index.tsx       # Home / dashboard
    root.tsx        # Root layout with sidebar
  schemas/          # Frontend Zod form schemas (independent of backend)
  query-client.ts   # TanStack Query client config
  router.ts         # TanStack Router setup
  route-tree.ts     # Route tree definition
openapi.json        # OpenAPI 3.1 spec (source of truth for code generation)
orval.config.ts     # orval code generation config
justfile            # Available commands
```

## justfile commands

| Command | Description |
|---|---|
| `just dev` | Start Vite dev server |
| `just build` | Type-check + production build |
| `just check` | Type-check only (no emit) |
| `just test` | Run tests |
| `just generate` | Generate API client from openapi.json |
| `just generate-watch` | Re-generate on openapi.json changes |
| `just up` | Start Docker containers |
| `just down` | Stop Docker containers |
| `just logs [service]` | Tail container logs |
| `just status` | Show container status |

## Adding a new resource

1. Add endpoints + schemas to `openapi.json`
2. `just generate` -- creates hooks, types, and MSW handlers in `src/api/`
3. Add a route directory under `src/routes/` with layout, index, detail pages
4. Add column definitions for the data table
5. Add Zod form schemas in `src/schemas/`
6. Add create/edit dialogs using react-hook-form + zodResolver

## Architecture

See [docs/README.md](docs/README.md) for architecture decisions and rules.

## Patterns

See [docs/patterns.md](docs/patterns.md) for copy-paste code patterns.
