export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  preferredCurrency?: 'USD' | 'EUR' | 'GBP'
  timezone?: string
  language?: string
  notificationSettings?: {
    paymentConfirmations: boolean
    failedTransactions: boolean
    weeklyReports: boolean
    priceAlerts: boolean
    securityAlerts: boolean
  }
  emailVerified?: boolean
  kycStatus?: 'pending' | 'verified' | 'rejected'
  walletAddress?: string
  twoFactorEnabled?: boolean
  accountDeletionScheduledFor?: string | null
}

const TOKEN_KEY = 'finpay_token'
const USER_KEY = 'finpay_user'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function setAuthData(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function updateStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthData(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken())
}
