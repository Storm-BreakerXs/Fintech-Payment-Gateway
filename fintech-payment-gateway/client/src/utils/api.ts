import { clearAuthData, getAuthToken } from './auth'

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

function ensureApiSuffix(url: string): string {
  const normalized = trimTrailingSlash(url)
  if (/\/api$/i.test(normalized)) {
    return normalized
  }
  return `${normalized}/api`
}

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim()
  if (configured) {
    return ensureApiSuffix(configured)
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api'
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api'
    }

    if (
      hostname === 'finpay.com.ng'
      || hostname === 'www.finpay.com.ng'
      || hostname === 'finpay.sbs'
      || hostname === 'www.finpay.sbs'
    ) {
      return 'https://api.finpay.com.ng/api'
    }

    if (hostname.endsWith('.onrender.com')) {
      return 'https://fintech-payment-gateway.onrender.com/api'
    }
  }

  return 'https://fintech-payment-gateway.onrender.com/api'
}

export const API_BASE_URL = resolveApiBaseUrl()

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
