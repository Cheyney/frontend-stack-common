# Code Patterns

Copy-paste references for daily work. All examples use actual patterns from this template.

For architecture decisions and known limitations, see [docs/README.md](README.md).

---

## Search param schema

Every route with URL-driven state needs a Zod schema. Use `.default().catch()` on every field — `.default()` handles missing params, `.catch()` handles invalid params (bookmarks, external links).

```ts
import { z } from 'zod'

export const mySearchSchema = z.object({
  page:   z.number().int().min(1).default(1).catch(1),
  limit:  z.number().int().min(1).max(100).default(20).catch(20),
  sort:   z.enum(['name', 'createdAt']).default('name').catch('name'),
  order:  z.enum(['asc', 'desc']).default('asc').catch('asc'),
  search: z.string().default('').catch(''),
})

export const myRoute = createRoute({
  getParentRoute: () => parentRoute,
  path: '/',
  validateSearch: mySearchSchema,  // Zod v4 via Standard Schema — no adapter
  component: MyPage,
})
```

**Banned:** `z.coerce.boolean()` for URL params — `"false"` coerces to `true`. Use `z.enum(["true","false"]).transform(v => v === "true")` instead.

**Required:** Define schemas at module scope, not inside components. Zod v4 JIT compilation makes schema creation 17x slower than reuse.

---

## Server-side data table

Use `manualPagination` + `manualSorting` and drive state from URL search params. No client-side row models (`getSortedRowModel`, `getPaginationRowModel`, `getFilteredRowModel` are all omitted).

```tsx
const { page, limit, sort, order, search } = myRoute.useSearch()
const navigate = useNavigate({ from: myRoute.fullPath })

const { data, isLoading, isFetching } = useListThings(
  { page, limit, sort, order, search },
  { query: { placeholderData: keepPreviousData } },
)

const sorting: SortingState = useMemo(
  () => [{ id: sort, desc: order === 'desc' }],
  [sort, order],
)
const pagination: PaginationState = useMemo(
  () => ({ pageIndex: page - 1, pageSize: limit }),
  [page, limit],
)

<DataTable
  columns={columns}
  data={data?.items ?? []}
  pageCount={Math.ceil((data?.total ?? 0) / limit)}
  total={data?.total ?? 0}
  sorting={sorting}
  pagination={pagination}
  onSortingChange={/* update URL */}
  onPaginationChange={/* update URL */}
  isLoading={isLoading}
  isFetching={isFetching}
/>
```

Key rules:
- `keepPreviousData` prevents table from going blank between pages
- `isFetching` (not `isLoading`) for subtle background indicators — `isLoading` only fires on first fetch
- Reset to page 1 on filter/search/sort changes
- URL is the single source of truth — refresh restores exact state

---

## Mutation + invalidation

Always invalidate with orval's generated query key factory. Never hand-write query keys.

```ts
import { useCreateItem, getListItemsQueryKey } from '@/api/items/items'

const queryClient = useQueryClient()
const mutation = useCreateItem()

mutation.mutate(
  { data: values },
  {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getListItemsQueryKey(),
      })
      toast.success('Item created')
      onClose()
    },
    onError: (error) => {
      // error is typed as ApiError — see error handling below
      toast.error(error.message)
    },
  },
)
```

Prefix invalidation works: `getListItemsQueryKey()` → `['/v1/items']` matches both list and detail queries because TanStack Query does prefix matching by default.

For optimistic updates:

```ts
onMutate: async ({ id, data }) => {
  await queryClient.cancelQueries({ queryKey: getGetItemQueryKey(id) })
  const previous = queryClient.getQueryData(getGetItemQueryKey(id))
  queryClient.setQueryData(getGetItemQueryKey(id), (old) => ({ ...old, ...data }))
  return { previous, id }
},
onError: (_err, _vars, context) => {
  if (context?.previous) {
    queryClient.setQueryData(getGetItemQueryKey(context.id), context.previous)
  }
},
onSettled: (_data, _err, { id }) => {
  void queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(id) })
  void queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() })
},
```

---

## Dialog + form

Controlled open state. Unmount form on close so react-hook-form resets cleanly — no manual `form.reset()` needed.

```tsx
function CreateThingDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PlusIcon /> New Thing</Button>
      </DialogTrigger>
      <DialogContent>
        {open && <CreateThingForm onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}
```

For edit dialogs, pass the entity as a prop and use external open state:

```tsx
<EditThingDialog thing={thing} open={editOpen} onOpenChange={setEditOpen} />
```

---

## Form with zodResolver

shadcn v4 dropped the `<Form>` wrapper component. Forms use react-hook-form directly with shadcn primitives.

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createThingSchema, type CreateThingInput } from '@/schemas/things'

const form = useForm<CreateThingInput>({
  resolver: zodResolver(createThingSchema),
  defaultValues: { name: '', description: null },
})

const onSubmit = form.handleSubmit((values) => {
  mutation.mutate({ data: values }, { onSuccess, onError })
})
```

Field with error display:

```tsx
<div>
  <Label htmlFor="name">Name</Label>
  <Input id="name" {...form.register('name')} />
  {form.formState.errors.name && (
    <p className="text-sm text-destructive mt-1">
      {form.formState.errors.name.message}
    </p>
  )}
</div>
```

For Select (Radix API — `onValueChange`, not `onChange`):

```tsx
<Select
  value={form.watch('role')}
  onValueChange={(v) => form.setValue('role', v, { shouldValidate: true })}
>
  ...
</Select>
```

**Banned:** `.transform()` on form schemas — diverges input/output types, breaks `useForm` typing. Transform in `onSubmit` instead, or use `.overwrite()` (Zod v4 only, type-preserving).

**Use `mutation.isPending`** for button disabled state, not `form.formState.isSubmitting`.

---

## Nullable textarea

Textareas bound to nullable string fields need `value ?? ''` for display and `'' → null` on change.

```tsx
<Textarea
  value={form.watch('description') ?? ''}
  onChange={(e) =>
    form.setValue(
      'description',
      e.target.value === '' ? null : e.target.value,
      { shouldValidate: true },
    )
  }
/>
```

---

## Error handling

The custom fetch mutator (`src/lib/fetcher.ts`) throws `ApiError` on non-2xx responses. TanStack Query receives this typed error.

```ts
import { ApiError } from '@/lib/fetcher'

// In mutation onError:
onError: (error) => {
  if (error instanceof ApiError && error.status === 422) {
    // Server returned validation errors — set on form fields
    const body = error.data as { errors?: { field: string; message: string }[] }
    body.errors?.forEach(({ field, message }) => {
      form.setError(field as keyof FormInput, { type: 'server', message })
    })
  } else {
    // Generic error — show as root error or toast
    form.setError('root.serverError', {
      type: 'server',
      message: error.message ?? 'Something went wrong',
    })
  }
}
```

Root-level server errors display manually:

```tsx
{form.formState.errors.root?.serverError && (
  <p className="text-sm text-destructive">
    {form.formState.errors.root.serverError.message}
  </p>
)}
```

---

## Adding a new resource

1. **Update `openapi.json`** — add endpoints + request/response schemas
2. **`just generate`** — orval regenerates `src/api/` with new hooks + types + mocks
3. **Update `src/mocks/browser.ts`** — import and spread the new mock handlers
4. **Create `src/routes/things/layout.tsx`** — layout route with `<Outlet />`
5. **Create `src/routes/things/columns.tsx`** — column definitions
6. **Create `src/routes/things/index.tsx`** — list page with search schema + DataTable
7. **Create `src/routes/things/detail.tsx`** — detail page
8. **Create `src/schemas/things.ts`** — form validation schemas
9. **Create `src/routes/things/create-dialog.tsx`** + **`edit-dialog.tsx`**
10. **Update `src/route-tree.ts`** — add new routes
11. **Update `src/components/app-sidebar.tsx`** — add nav item

---

## Adding a shadcn component

```bash
bunx shadcn@latest add <component-name>
```

Components install to `src/components/ui/`. They are plain files you own and can edit.

---

## orval regeneration

After changing `openapi.json`:

```bash
just generate           # one-shot
just generate-watch     # watches openapi.json, regenerates on save
```

orval outputs to `src/api/` with `clean: true` — old generated files are removed before new ones are written. TypeScript picks up changes immediately (no restart needed).

The generated files are committed to git as example output. After regeneration, review the diff before committing.
