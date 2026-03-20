import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDownIcon, MoreHorizontalIcon, PencilIcon, TrashIcon } from 'lucide-react'
import type { Item } from '@/api/itemsCRUDAPI.schemas'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ColumnCallbacks {
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function getItemColumns({
  onEdit,
  onDelete,
}: ColumnCallbacks): ColumnDef<Item, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === 'asc')
          }
        >
          Name
          <ArrowUpDownIcon />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue<string>('name')}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue<string | null>('description')
        return (
          <span className={description ? undefined : 'text-muted-foreground'}>
            {description ?? '\u2014'}
          </span>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === 'asc')
          }
        >
          Created
          <ArrowUpDownIcon />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue<string>('created_at'))
        return date.toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(item.id)
                }}
              >
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(item.id)
                }}
              >
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
