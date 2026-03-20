import { useMemo } from 'react'
import { z } from 'zod'
import { createRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { keepPreviousData } from '@tanstack/react-query'
import type { PaginationState, SortingState } from '@tanstack/react-table'
import { itemsLayoutRoute } from './layout'
import { getItemColumns } from './columns'
import { CreateItemDialog } from './create-dialog'
import { useListItems } from '@/api/items/items'
import type { ListItemsParams } from '@/api/itemsCRUDAPI.schemas'
import { DataTable } from '@/components/data-table/data-table'
import { SearchInput } from '@/components/data-table/search-input'

export const itemsSearchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  limit: z.number().int().min(1).max(100).default(20).catch(20),
  sort: z.enum(['name', 'createdAt']).default('name').catch('name'),
  order: z.enum(['asc', 'desc']).default('asc').catch('asc'),
  search: z.string().default('').catch(''),
})

export const itemsIndexRoute = createRoute({
  getParentRoute: () => itemsLayoutRoute,
  path: '/',
  validateSearch: itemsSearchSchema,
  component: ItemsPage,
})

/** Map our URL sort field to TanStack Table column id */
const sortFieldToColumnId: Record<string, string> = {
  name: 'name',
  createdAt: 'created_at',
}

/** Map TanStack Table column id back to URL sort field */
const columnIdToSortField: Record<string, string> = {
  name: 'name',
  created_at: 'createdAt',
}

function ItemsPage() {
  const { page, limit, sort, order, search } = itemsIndexRoute.useSearch()
  const navigate = useNavigate({ from: itemsIndexRoute.fullPath })
  const router = useRouter()

  // Build query params for the API
  const queryParams: ListItemsParams = {
    page,
    limit,
    sort: sort as ListItemsParams['sort'],
    order: order as ListItemsParams['order'],
    search: search || undefined,
  }

  const { data, isLoading, isFetching } = useListItems(queryParams, {
    query: { placeholderData: keepPreviousData },
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / limit))

  // Derive TanStack Table state from URL
  const sorting: SortingState = useMemo(
    () => [{ id: sortFieldToColumnId[sort] ?? 'name', desc: order === 'desc' }],
    [sort, order],
  )

  const pagination: PaginationState = useMemo(
    () => ({ pageIndex: page - 1, pageSize: limit }),
    [page, limit],
  )

  const columns = useMemo(
    () =>
      getItemColumns({
        onEdit: (_id) => {
          // Placeholder — will be wired in Task 12
        },
        onDelete: (_id) => {
          // Placeholder — will be wired in Task 12
        },
      }),
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Items</h1>
        <CreateItemDialog />
      </div>
      <SearchInput
        value={search}
        onSearch={(value) =>
          void navigate({ search: { page: 1, limit, sort, order, search: value } })
        }
        placeholder="Search items..."
      />
      <DataTable
        columns={columns}
        data={items}
        pageCount={pageCount}
        total={total}
        sorting={sorting}
        pagination={pagination}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyMessage="No items found."
        onSortingChange={(updater) => {
          const next =
            typeof updater === 'function' ? updater(sorting) : updater
          if (next.length > 0) {
            const col = next[0]
            const sortField = columnIdToSortField[col.id] ?? 'name'
            void navigate({
              search: {
                page: 1,
                limit,
                sort: sortField as 'name' | 'createdAt',
                order: col.desc ? 'desc' : 'asc',
                search,
              },
            })
          }
        }}
        onPaginationChange={(updater) => {
          const next =
            typeof updater === 'function' ? updater(pagination) : updater
          void navigate({
            search: {
              page: next.pageIndex + 1,
              limit: next.pageSize,
              sort,
              order,
              search,
            },
          })
        }}
        onRowClick={(row) =>
          void router.navigate({ to: `/items/${row.id}` })
        }
      />
    </div>
  )
}
