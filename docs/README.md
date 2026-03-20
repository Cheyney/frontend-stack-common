# Architecture

## Decisions

### Why React 19 over Svelte

Ecosystem depth. shadcn/ui, TanStack Router, TanStack Query, TanStack Table, react-hook-form, and orval all target React as primary. Svelte equivalents exist but are less mature and less maintained. For CRUD-heavy admin UIs, library availability matters more than raw performance.

### Why TanStack Router over React Router

Typed Zod search params. TanStack Router validates URL search params with a Zod schema at the route level, giving us type-safe URL-driven table state (page, sort, order, search) without manual parsing. React Router has no equivalent.

### Why orval over openapi-ts

CRUD needs more than types. orval generates TanStack Query hooks (useQuery, useMutation), query key factories, and MSW mock handlers from the OpenAPI spec. openapi-ts only generates types and a basic client -- you'd write all the hooks by hand.

### Why Zod v4 on frontend

Both shadcn form patterns and TanStack Router's `validateSearch` expect Zod schemas. Zod v4 is the current version and aligns with the rest of the stack.

### Frontend Zod schemas are independent of backend

The OpenAPI spec is the contract boundary. Frontend form schemas in `src/schemas/` are authored by hand and may differ from backend validation (e.g., `nullish()` for optional textarea fields). orval generates the API types; form schemas are separate.

## Rules

- **Always TanStack Query for data fetching.** No `useEffect` + `setState` for API calls. Use the generated hooks from orval.
- **Always use orval's generated query keys.** Use `getListItemsQueryKey()` / `getGetItemQueryKey(id)` for cache invalidation. Never hand-craft query keys.
- **Custom fetch mutator throws on non-2xx.** The `customFetch` wrapper in `src/lib/fetcher.ts` throws `ApiError` for any non-2xx response. TanStack Query's `onError` receives this typed error.
- **`.default(x).catch(x)` for all search params.** Every field in a route's search schema must use `.default(value).catch(value)` so invalid/missing URL params silently fall back instead of throwing.
- **No `.transform()` on form schemas.** Transforms break `zodResolver` -- the inferred input type won't match the form field types. Handle any transformations in the submit handler.
- **No React Compiler.** TanStack Table v8 is incompatible with React Compiler's automatic memoization. Disabled in this template.
- **List response arrays named `items` not `data`.** The OpenAPI spec uses `items` as the key for paginated arrays. This avoids collision with TanStack Query's `data` property.

## Known limitations

- **TanStack Table v8 is frozen.** v9 is in development. When v9 stabilises, migration will be needed.
- **orval Zod output skipped.** orval can generate Zod schemas from the OpenAPI spec, but Zod v4 support is undertested. We skip it and write frontend schemas by hand.
- **shadcn v4 dropped the Form wrapper component.** Form fields use raw `register()` / `setValue()` with manual error display instead of the `<FormField>` wrapper from shadcn v3.
