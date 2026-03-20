# Architecture & Decisions

> [Root README](../README.md) | [Code Patterns](patterns.md)

Why the stack is shaped the way it is. No code examples here — those live in [patterns.md](patterns.md).

## Core Architecture

### The Type Chain

```
Backend (api-stack-common)          Frontend (this template)
  │                                   │
  Zod schemas                         orval reads openapi.json
  │                                   │
  @hono/zod-openapi                   generates typed hooks + query keys + MSW mocks
  │                                   │
  openapi.json (OpenAPI 3.1)          useListItems(), useCreateItem(), getListItemsQueryKey()
  │                                   │
  committed to repo ──────────────────→ consumed by React via TanStack Query v5
```

The OpenAPI spec is the contract boundary. Frontend Zod schemas (for forms and search params) are independent of backend Zod schemas. They validate different things at different layers.

### URL as Single Source of Truth

The primary interaction pattern for data-heavy internal tools:

```
URL search params ──→ Zod validates ──→ TanStack Query fetches ──→ TanStack Table renders
       ↑                                                                    │
       └──────────────── navigate({ search }) ←──────── user interacts ─────┘
```

Page refresh restores exact table state. Shareable URLs. Back button works. No local state for table pagination/sorting/filtering.

### What You Write Per Resource

1. Update `openapi.json` — add endpoints + schemas
2. `just generate` — orval produces hooks, types, query keys, MSW mocks
3. A Zod search schema (~5 lines) — URL param validation
4. A columns file (~50 lines) — TanStack Table column defs
5. A list page (~80 lines) — wires DataTable to generated hooks via URL state
6. A detail page (~60 lines) — single item view
7. Form schemas (~10 lines) — hand-written Zod for create/edit
8. Dialog components (~50 lines each) — create/edit modals

The DataTable, pagination, search input, and fetch mutator are shared infrastructure — write once, reuse across resources.

---

## Why Each Component

### React 19

Ecosystem depth. shadcn/ui (110K stars), TanStack Router/Query/Table, react-hook-form, and orval all target React as primary. For CRUD-heavy internal tools, library availability matters more than raw performance or bundle size.

### Vite 8

Rolldown (Rust bundler) + Oxc (Rust transformer) replaced esbuild + Rollup. `@vitejs/plugin-react` v6 uses Oxc for JSX — no Babel by default. Native `resolve.tsconfigPaths` replaces the `vite-tsconfig-paths` plugin. 92% usage in State of React 2025 survey — uncontested.

### TanStack Router

Typed Zod search params via Standard Schema. `validateSearch: z.object({...})` gives type-safe URL-driven table state without manual parsing. React Router has no equivalent — search params are stringly-typed. Code-based routing (no file-based, no Vite plugin).

### TanStack Query v5

Server state management. 68% usage, 42% positive / 1% negative sentiment (State of React 2025). `keepPreviousData` prevents table flicker between pages. Query key factories from orval enable precise cache invalidation. DevTools are best-in-class.

### TanStack Table v8

Headless table engine. shadcn/ui's data table is built on it. ~15KB, complete sorting/pagination/filtering logic with full UI control. Server-side mode (`manualPagination`, `manualSorting`) delegates computation to the API.

### shadcn/ui

Copy-paste components on Radix primitives. You own the source — no version-bump migrations, no black-box behavior. 110K stars, 56% usage (180% growth year-over-year). AI tools (v0, Cursor, Lovable) standardized on it.

### Tailwind CSS 4

`@tailwindcss/vite` plugin replaces PostCSS. No `tailwind.config.ts` — theme lives in CSS via `@theme`. OKLCH color system (perceptually uniform). 78% usage in State of React 2025.

### Zod v4

Already a dependency — shadcn form patterns and TanStack Router both expect it. 78% usage. v4 brings 14x faster validation via JIT compilation. Standard Schema interface means schemas work with TanStack Router's `validateSearch` natively (no adapter needed).

### orval

Generates TanStack Query v5 hooks, mutation hooks, query key factories, and MSW mock handlers from the OpenAPI spec. One config, one `just generate`. The spec changes when we change it — regeneration costs nothing for internal tooling.

### react-hook-form

74% usage (State of React 2025). `zodResolver` bridges Zod schemas to form validation. Minimal re-renders. Works with shadcn primitives directly.

### Bun

Package manager + JS runtime. `bun install` is 30x faster than npm. `bun test` runs the fetcher and schema tests. `bunx --bun vite` ensures Vite runs under Bun's runtime.

### MSW

Mock Service Worker intercepts fetch at the service worker level. orval generates handlers with faker data. Dev server works standalone without a running backend. Conditional activation — `import.meta.env.DEV` only, tree-shaken from production.

---

## Known Limitations & Mitigations

### TanStack Table v8

**Dead branch** — Zero bug fixes since April 2025. The team ships v9 alphas exclusively. v8 is stable for basic use but unfixed bugs accumulate.

**React Compiler incompatible** — `table.getHeaderGroups()` violates Rules of React (called in render with zero params, but returns different results based on internal mutation). React Compiler memoizes it incorrectly. Requires `"use no memo"` on every file importing from `@tanstack/react-table`. **Mitigated** by not enabling React Compiler in this template. (TanStack/table#5567)

**Memory leak in `getFilteredRowModel`** — Heap growth on filter/clear cycles in React 19.2. Internal caching retains filtered row arrays after state clears. **Mitigated** by using server-side filtering (`manualFiltering: true`) — the client-side `getFilteredRowModel` is not used. (TanStack/table#6170)

**Column visibility broken with React 19.2** — Headers update but cells don't when toggling column visibility. (TanStack/table#6117)

**v9 migration will be breaking** — `useReactTable` → `useTable`, plugin model restructured, `getCoreRowModel()` gone, new reactivity model via `@tanstack/store`. `useLegacyTable` shim exists but is deprecated. shadcn/ui has made zero moves toward v9. **When v9 ships stable and shadcn updates, the template will need updating.**

### orval

**Default fetch client does NOT throw on non-2xx** — A 404 or 500 is silently returned as the success type. **Mitigated** by the mandatory custom fetch mutator in `src/lib/fetcher.ts` that throws `ApiError`.

**`ErrorType` detected via text scan** — orval scans the mutator source file for `export type ErrorType`. The export must be named exactly `ErrorType` — no aliases. (orval source line 3294)

**`includeHttpResponseReturnType` defaults to `true`** — Wraps responses in `{ data, status, headers }`, causing triple `.data.data.data` nesting on list endpoints. **Mitigated** by setting `includeHttpResponseReturnType: false` in `orval.config.ts`. (orval#2749)

**Zod output undertested for v4** — orval's Zod code generation has known bugs with Zod v4: `enum` + `minLength` generates invalid code (orval#3024, fix reverted), UUID + pattern generates invalid code (orval#3097). **Mitigated** by skipping Zod output entirely — frontend Zod schemas are hand-written. (orval#3111)

**Nullable object MSW mocks broken** — OAS 3.1 `type: ["object", "null"]` causes mock generators to always return `null`, dropping all object properties. Nullable strings work correctly. (orval#3081)

**Query keys are path-string-based** — `getListItemsQueryKey()` → `['/v1/items']`. Prefix invalidation works (TanStack Query matches prefixes by default), but there are no named key helpers like `invalidateListItems()`. Invalidation is manual via `queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() })`.

### Zod v4

**Schema construction JIT penalty** — Zod v4 uses `new Function` for JIT compilation. Reused schemas are 7-14x faster than v3, but dynamically created schemas (inside components, per-render) are 17x slower. **Mitigated** by the architecture rule: Zod schemas at module scope, never inside components.

**`z.coerce.boolean()` broken for URL params** — `"false"` coerces to `true` (uses `Boolean()` constructor). **Mitigated** by banning it — use `z.enum(["true","false"]).transform(v => v === "true")` instead.

**Async refines in search schemas** — Hard-throws `SearchParamError` with no recovery. The router does not surface this to error boundaries — it silently falls back to parent search state. **Mitigated** by banning async refines in search schemas.

**`.default()` inside `.optional()` changed behavior** — v4 now applies the default value instead of returning `undefined`. **Mitigated** by setting defaults in `useForm({ defaultValues })` instead of in the Zod schema.

**`@tanstack/zod-adapter` breaks types with v4** — The adapter reads `_input`/`_output` properties that Zod v4 removed. Results in total type erasure (everything becomes `undefined`). **Mitigated** by not installing it — Zod v4 works natively via Standard Schema. (TanStack/router#4322)

### Tailwind CSS

**Sustainability risk** — Tailwind Labs laid off 75% of engineering in January 2026. Revenue dropped ~80% as AI tools generate Tailwind without users visiting docs. Vercel and Google pledged sponsorship. MIT-licensed code persists regardless, but maintenance cadence may slow. CSS Modules is the zero-dependency fallback if needed.

### TanStack ecosystem concentration

Router + Query + Table are one LLC. **Mitigated** by MIT licensing (code persists regardless of org), no shared runtime between packages, and each is independently replaceable (Router → React Router, Query → SWR, Table → AG Grid).

### shadcn/ui v4

**Form wrapper component dropped** — shadcn v4 no longer ships a `<Form>` / `<FormField>` / `<FormMessage>` component. Forms use react-hook-form directly with shadcn primitives (Input, Label, Textarea). Error display is manual via `formState.errors`.

**`forwardRef` removed** — React 19 makes it unnecessary. Don't write wrappers that depend on ref forwarding from shadcn primitives.

### Vite 8

**`erasableSyntaxOnly: true`** — Oxc strips TypeScript types without transforming them. TypeScript `enum` and `namespace` are not erasable — they require transformation. Use `as const` objects or union types instead.

**`verbatimModuleSyntax: true`** — Type-only imports must use `import type { Foo }` or `import { type Foo }`. The compiler errors if you import a type without the `type` keyword.

**`resolve.tsconfigPaths` is `@experimental`** — Functionally works and Vite recommends it over the plugin. Reads from the nearest `tsconfig.json` and follows project references. No way to specify a custom tsconfig path — auto-discovery only.

---

## Version Pins

| Package | Pin | Why |
|---------|-----|-----|
| `zod` | `>= 4.0.6` | Standard Schema fix for TanStack Router catch types |
| `@hookform/resolvers` | `>= 5.2.2` | Earlier 5.x had Zod v4 output-type regressions |
| `orval` | `>= 8.2.0` | OAS 3.1 type array support; 8.5.x for latest fixes |
| `@faker-js/faker` | explicit devDep | Required peer dep when using orval `mock: true` |
| `@tanstack/zod-adapter` | **do not install** | Breaks types with Zod v4 — type erasure |

---

## Discarded Alternatives

| Tool | Why Discarded |
|------|--------------|
| Svelte 5 | SvelteKit SPA discouraged by Rich Harris. TanStack Table adapter broken. Runes have real bugs. Single-maintainer risk (huntabyte owns shadcn-svelte + Bits UI + Table workaround). Satisfaction lead over React collapsed. |
| React Router v7 | Search params stringly-typed without extra libraries. TanStack Router's Zod search params are the primary use case for URL-driven data tables. |
| openapi-react-query | Alpha quality (0.5.x). `onError` context typed as `unknown`. Silent HTTP error swallowing on empty bodies. No typed cache invalidation. 158K weekly downloads, no production case studies. |
| hey-api/openapi-ts | Solo maintainer, 434 open issues, no semver (minor bumps contain breaking changes). Nullable/oneOf bug in OAS 3.1 path open 5+ months. |
| File-based routing | Requires TanStack Router Vite plugin. Overhead for 10 routes. Code-based routing is first-class and requires no plugin. |
| React Compiler | TanStack Table v8 is architecturally incompatible. Disabled. |

---

## Verification Checklist

After cloning and setting up a new instance:

1. `bun install` — completes without errors
2. `just generate` — orval produces `src/api/` with hooks + mocks
3. `just check` — `tsc -b --noEmit` passes clean
4. `just test` — all tests pass (fetcher + search schema)
5. `just build` — produces `dist/` with `index.html` + hashed assets
6. `just dev` — Vite dev server starts, MSW mocks active
7. Navigate to `/items` — data table renders with mock data
8. Sort/paginate/search — URL updates, table reflects state
9. Create item — dialog opens, form validates, mutation fires, table refreshes
10. Edit/delete item — from detail page, mutations work, navigation correct
