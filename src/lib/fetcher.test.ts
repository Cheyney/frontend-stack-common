import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { customFetch, ApiError } from './fetcher'

const mockFetch = mock(() => Promise.resolve(new Response()))
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('customFetch', () => {
  it('returns parsed JSON on 200', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1', name: 'Test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const result = await customFetch<{ id: string; name: string }>('/v1/items/1', { method: 'GET' })
    expect(result).toEqual({ id: '1', name: 'Test' })
  })

  it('returns undefined on 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
    const result = await customFetch('/v1/items/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('throws ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        statusText: 'Not Found',
      }),
    )
    try {
      await customFetch('/v1/items/bad-id', { method: 'GET' })
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(404)
      expect((e as ApiError).data).toEqual({ message: 'Not found' })
    }
  })

  it('throws ApiError on 422 with validation errors', async () => {
    const body = { message: 'Validation failed', errors: [{ field: 'name', message: 'Required' }] }
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status: 422, statusText: 'Unprocessable Entity' }),
    )
    try {
      await customFetch('/v1/items', { method: 'POST' })
      expect(true).toBe(false)
    } catch (e) {
      expect((e as ApiError).status).toBe(422)
      expect((e as ApiError).data).toEqual(body)
    }
  })

  it('throws ApiError on 500 with non-JSON body', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' }),
    )
    try {
      await customFetch('/v1/items', { method: 'GET' })
      expect(true).toBe(false)
    } catch (e) {
      expect((e as ApiError).status).toBe(500)
      expect((e as ApiError).data).toEqual({ message: 'Internal Server Error' })
    }
  })

  it('forwards signal for abort support', async () => {
    const controller = new AbortController()
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    await customFetch('/v1/items', { method: 'GET', signal: controller.signal })
    expect(mockFetch.mock.calls[0][1]?.signal).toBe(controller.signal)
  })
})
