import { createRoute, Link } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { itemsLayoutRoute } from './layout'
import { useGetItem } from '@/api/items/items'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const itemDetailRoute = createRoute({
  getParentRoute: () => itemsLayoutRoute,
  path: '$id',
  component: ItemDetailPage,
})

function ItemDetailPage() {
  const { id } = itemDetailRoute.useParams()
  const { data: item, isLoading, isError, error, refetch } = useGetItem(id)

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
            <Button variant="outline">
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button variant="destructive">
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
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
