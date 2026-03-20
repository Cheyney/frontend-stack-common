import { useState } from 'react'
import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { itemsLayoutRoute } from './layout'
import { EditItemDialog } from './edit-dialog'
import { useGetItem, useDeleteItem, getListItemsQueryKey } from '@/api/items/items'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const itemDetailRoute = createRoute({
  getParentRoute: () => itemsLayoutRoute,
  path: '$id',
  component: ItemDetailPage,
})

function ItemDetailPage() {
  const { id } = itemDetailRoute.useParams()
  const { data: item, isLoading, isError, error, refetch } = useGetItem(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteMutation = useDeleteItem()

  const handleDelete = () => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getListItemsQueryKey(),
          })
          toast.success('Item deleted')
          void navigate({ to: '/items' })
        },
        onError: (err) => {
          toast.error(err.message ?? 'Failed to delete item')
        },
      },
    )
  }

  if (isLoading) {
    return <ItemDetailSkeleton />
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <Link to="/items" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to items
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Error loading item</AlertTitle>
          <AlertDescription>
            {error?.message ?? 'An unexpected error occurred.'}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="space-y-4">
      <Link to="/items" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to items
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{item.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            {item.description ? (
              <p className="mt-1">{item.description}</p>
            ) : (
              <p className="mt-1 text-muted-foreground italic">No description</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Created</p>
            <p className="mt-1">
              {new Date(item.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">ID</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{item.id}</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditItemDialog item={item} open={editOpen} onOpenChange={setEditOpen} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{item.name}&rdquo;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ItemDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-28" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-1 h-4 w-64" />
          </div>
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-1 h-4 w-40" />
          </div>
          <div>
            <Skeleton className="h-4 w-8" />
            <Skeleton className="mt-1 h-4 w-56" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
