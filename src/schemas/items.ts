import { z } from 'zod'

export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(255, { message: 'Name must be 255 characters or fewer' }),
  description: z
    .string()
    .max(1000, { message: 'Description must be 1000 characters or fewer' })
    .nullish(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>

export const editItemSchema = createItemSchema
export type EditItemInput = z.infer<typeof editItemSchema>
