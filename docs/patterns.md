# Patterns

Copy-paste references for common tasks in this template.

## Search param schema

Every route with URL-driven state needs a Zod schema. Use `.default().catch()` on every field.

```ts
import { z } from 'zod'

export const mySearchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  limit: z.number().int().min(1).max(100).default(20).catch(20),
  sort: z.enum(['name', 'createdAt']).default('name').catch('name'),
  order: z.enum(['asc', 'desc']).default('asc').catch('asc'),
  search: z.string().default('').catch(''),
})

export const myRoute = createRoute({
  getParentRoute: () => parentRoute,
  path: '/',
  validateSearch: mySearchSchema,
  component: MyPage,
})
```

## Server-side data table

Use `manualPagination` + `manualSorting` and drive state from URL search params.

```tsx
const { page, limit, sort, order } = myRoute.useSearch()
const navigate = useNavigate({ from: myRoute.fullPath })

const { data, isLoading, isFetching } = useListThings(
  { page, limit, sort, order },
  { query: { placeholderData: keepPreviousData } },
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

## Mutation + invalidation

Always invalidate with orval's generated query key factory.

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
      form.setError('root.serverError', {
        type: 'server',
        message: error.message,
      })
    },
  },
)
```

## Dialog + form

Controlled open state. Unmount form on close so react-hook-form resets cleanly.

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

## Form with zodResolver

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

## Nullable textarea

Textareas bound to nullable string fields need `value ?? ''` for display and `'' -> null` on change.

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

## Error handling

The custom fetch mutator throws `ApiError` on non-2xx responses.

```ts
import { ApiError } from '@/lib/fetcher'

// In mutation onError:
onError: (error) => {
  if (error instanceof ApiError && error.status === 422) {
    // Handle validation errors from the server
    form.setError('root.serverError', {
      type: 'server',
      message: error.message,
    })
  } else {
    toast.error(error.message ?? 'Something went wrong')
  }
}
```

## Adding a shadcn component

```bash
bunx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`. They are plain files you own and can edit.
