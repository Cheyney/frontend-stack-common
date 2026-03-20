import { setupWorker } from 'msw/browser'
import { getItemsMock } from '@/api/items/items.msw'

export const worker = setupWorker(...getItemsMock())
