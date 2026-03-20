import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useCreateItem, getListItemsQueryKey } from '@/api/items/items'
import { createItemSchema } from '@/schemas/items'
import type { CreateItemInput } from '@/schemas/items'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function CreateItemDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        {open && <CreateItemForm onClose={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function CreateItemForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const mutation = useCreateItem()

  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      description: null,
    },
  })

  const onSubmit = form.handleSubmit((values) => {
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
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>New Item</DialogTitle>
      </DialogHeader>

      {form.formState.errors.root?.serverError?.message && (
        <p className="text-sm text-destructive">
          {form.formState.errors.root.serverError.message}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
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
          {mutation.isPending ? 'Creating...' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  )
}
