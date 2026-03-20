import { describe, it, expect } from 'bun:test'
import { itemsSearchSchema } from './index'

describe('itemsSearchSchema', () => {
  it('returns defaults for empty input', () => {
    const result = itemsSearchSchema.parse({})
    expect(result).toEqual({ page: 1, limit: 20, sort: 'name', order: 'asc', search: '' })
  })

  it('catches invalid values and returns defaults', () => {
    const result = itemsSearchSchema.parse({ page: 'garbage', sort: 'invalid', order: 99 })
    expect(result).toEqual({ page: 1, limit: 20, sort: 'name', order: 'asc', search: '' })
  })

  it('preserves valid values', () => {
    const result = itemsSearchSchema.parse({ page: 3, limit: 50, sort: 'createdAt', order: 'desc', search: 'test' })
    expect(result).toEqual({ page: 3, limit: 50, sort: 'createdAt', order: 'desc', search: 'test' })
  })
})
