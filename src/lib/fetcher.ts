const BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  readonly statusText: string
  readonly data: unknown

  constructor(status: number, statusText: string, data: unknown, message?: string) {
    super(message ?? `API error ${status}: ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

export type ErrorType<T = unknown> = ApiError & { data: T }

export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${url}`, options)

  if ([204, 205, 304].includes(response.status)) {
    return undefined as T
  }

  const text = await response.text()

  if (!response.ok) {
    let data: unknown
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { message: text }
    }
    throw new ApiError(response.status, response.statusText, data) as ErrorType
  }

  return text ? (JSON.parse(text) as T) : (undefined as T)
}
