import { clearAuthData, getAuthToken } from './auth'

export const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV
    ? 'http://localhost:3001/api'
    : 'https://fintech-payment-gateway.onrender.com/api')

function resolveErrorMessage(payload: any): string {
  if (payload?.error && typeof payload.error === 'string') return payload.error
  if (payload?.error?.message && typeof payload.error.message === 'string') return payload.error.message
  if (payload?.message && typeof payload.message === 'string') return payload.message
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors[0]?.msg || 'Validation failed'
  }
  return 'Request failed. Please try again.'
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<T> {
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (requiresAuth) {
    const token = getAuthToken()
    if (!token) {
      throw new Error('You need to log in to continue.')
    }
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    if (requiresAuth && (response.status === 401 || response.status === 403)) {
      clearAuthData()
    }

    const message = typeof payload === 'string'
      ? payload
      : resolveErrorMessage(payload)

    throw new Error(message)
  }

  return payload as T
}
