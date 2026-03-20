import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  useUpdateItem,
  getListItemsQueryKey,
  getGetItemQueryKey,
} from '@/api/items/items'
import type { Item } from '@/api/itemsCRUDAPI.schemas'
import { editItemSchema } from '@/schemas/items'
import type { EditItemInput } from '@/schemas/items'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EditItemDialogProps {
  item: Item
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditItemDialog({
  item,
  open,
  onOpenChange,
}: EditItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <EditItemForm item={item} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditItemForm({
  item,
  onClose,
}: {
  item: Item
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const mutation = useUpdateItem()

  const form = useForm<EditItemInput>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description ?? null,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(
      { id: item.id, data: values },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getListItemsQueryKey(),
          })
          void queryClient.invalidateQueries({
            queryKey: getGetItemQueryKey(item.id),
          })
          toast.success('Item updated')
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
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edit Item</DialogTitle>
      </DialogHeader>

      {form.formState.errors.root?.serverError?.message && (
        <p className="text-sm text-destructive">
          {form.formState.errors.root.serverError.message}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          placeholder="Enter item name"
          aria-invalid={!!form.formState.errors.name}
          {...form.register('name')}
        />
        {form.formState.errors.name?.message && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          placeholder="Enter description (optional)"
          aria-invalid={!!form.formState.errors.description}
          value={form.watch('description') ?? ''}
          onChange={(e) =>
            form.setValue(
              'description',
              e.target.value === '' ? null : e.target.value,
              { shouldValidate: true },
            )
          }
        />
        {form.formState.errors.description?.message && (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  )
}
