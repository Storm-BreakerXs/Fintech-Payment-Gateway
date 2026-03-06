import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Globe,
  KeyRound,
  Loader2,
  Monitor,
  RefreshCw,
  Shield,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useWeb3Store } from '../hooks/useWeb3'
import { apiRequest } from '../utils/api'
import { AuthUser, clearAuthData, updateStoredUser } from '../utils/auth'
import { visualAssets } from '../content/visualAssets'

type SettingsSection = 'profile' | 'notifications' | 'security' | 'wallets' | 'preferences'

interface MeResponse {
  user: AuthUser
}

interface SessionItem {
  id: string
  userAgent: string
  ipAddress: string
  revokedAt: string | null
  lastSeenAt: string
  createdAt: string
  isCurrent: boolean
}

interface SessionsResponse {
  sessions: SessionItem[]
}

const settingsSections: Array<{ id: SettingsSection; label: string; icon: typeof User }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'wallets', label: 'Connected Wallets', icon: Wallet },
  { id: 'preferences', label: 'Preferences', icon: Globe },
]

function formatDateTime(value?: string | null): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

export default function Settings() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelingDeletion, setIsCancelingDeletion] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [cancelDeletePassword, setCancelDeletePassword] = useState('')
  const [profile, setProfile] = useState<AuthUser | null>(null)

  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [isProcessingTwoFa, setIsProcessingTwoFa] = useState(false)
  const [twoFaSecret, setTwoFaSecret] = useState('')
  const [twoFaQrCodeDataUrl, setTwoFaQrCodeDataUrl] = useState('')
  const [twoFaEnableCode, setTwoFaEnableCode] = useState('')
  const [twoFaRecoveryCode, setTwoFaRecoveryCode] = useState('')
  const [twoFaDisablePassword, setTwoFaDisablePassword] = useState('')
  const [twoFaDisableCode, setTwoFaDisableCode] = useState('')
  const [twoFaDisableRecoveryCode, setTwoFaDisableRecoveryCode] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD')
  const [timezone, setTimezone] = useState('UTC')
  const [language, setLanguage] = useState('en')

  const [notifications, setNotifications] = useState({
    paymentConfirmations: true,
    failedTransactions: true,
    weeklyReports: false,
    priceAlerts: true,
    securityAlerts: true,
  })

  const { isConnected, address, balance, chainId, disconnect } = useWeb3Store()

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiRequest<MeResponse>('/users/me', {}, true)
      setProfile(data.user)
      setFirstName(data.user.firstName || '')
      setLastName(data.user.lastName || '')
      setPhone(data.user.phone || '')
      setPreferredCurrency(data.user.preferredCurrency || 'USD')
      setTimezone(data.user.timezone || 'UTC')
      setLanguage(data.user.language || 'en')
      setNotifications({
        paymentConfirmations: data.user.notificationSettings?.paymentConfirmations ?? true,
        failedTransactions: data.user.notificationSettings?.failedTransactions ?? true,
        weeklyReports: data.user.notificationSettings?.weeklyReports ?? false,
        priceAlerts: data.user.notificationSettings?.priceAlerts ?? true,
        securityAlerts: data.user.notificationSettings?.securityAlerts ?? true,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not load settings.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true)
    try {
      const data = await apiRequest<SessionsResponse>('/auth/sessions', {}, true)
      setSessions(data.sessions || [])
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not load sessions.'
      toast.error(message)
    } finally {
      setIsLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (activeSection === 'security') {
      loadSessions()
    }
  }, [activeSection, loadSessions])

  const networkName = useMemo(() => {
    if (!chainId) return 'Unknown'
    const networkMap: Record<number, string> = {
      1: 'Ethereum',
      5: 'Goerli',
      56: 'BSC',
      137: 'Polygon',
      43114: 'Avalanche',
      1337: 'Local',
    }
    return networkMap[chainId] || `Chain ${chainId}`
  }, [chainId])

  const canSaveProfileSettings = activeSection === 'profile'
    || activeSection === 'notifications'
    || activeSection === 'preferences'

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaved(false)

    try {
      const payload: {
        firstName: string
        lastName: string
        preferredCurrency: 'USD' | 'EUR' | 'GBP'
        timezone: string
        language: string
        notificationSettings: {
          paymentConfirmations: boolean
          failedTransactions: boolean
          weeklyReports: boolean
          priceAlerts: boolean
          securityAlerts: boolean
        }
        phone?: string
      } = {
        firstName,
        lastName,
        preferredCurrency,
        timezone,
        language,
        notificationSettings: notifications,
      }

      const normalizedPhone = phone.trim()
      if (normalizedPhone) {
        payload.phone = normalizedPhone
      }

      const data = await apiRequest<MeResponse & { message: string }>(
        '/users/me',
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
        true
      )

      setProfile(data.user)
      updateStoredUser(data.user)
      setSaved(true)
      toast.success(data.message || 'Settings saved successfully.')
      setTimeout(() => setSaved(false), 3000)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not save settings.'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleScheduleAccountDeletion = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm account deletion.')
      return
    }

    if (!deletePassword.trim()) {
      toast.error('Enter your password to continue.')
      return
    }

    setIsDeleting(true)
    try {
      const data = await apiRequest<{ message: string; scheduledFor: string; shouldSignOut?: boolean }>(
        '/users/delete-account',
        {
          method: 'POST',
          body: JSON.stringify({
            password: deletePassword,
            confirmation: 'DELETE',
          }),
        },
        true
      )

      setProfile((prev) => {
        if (!prev) return prev
        const next = { ...prev, accountDeletionScheduledFor: data.scheduledFor }
        updateStoredUser(next)
        return next
      })
      setDeleteConfirmation('')
      setDeletePassword('')
      if (isConnected) {
        disconnect()
      }
      clearAuthData()
      toast.success(data.message || 'Account deletion has been scheduled. You have been signed out.')
      navigate('/auth?mode=login', { replace: true })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not schedule account deletion.'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelAccountDeletion = async () => {
    if (!cancelDeletePassword.trim()) {
      toast.error('Enter your password to cancel deletion.')
      return
    }

    setIsCancelingDeletion(true)
    try {
      const data = await apiRequest<{ message: string }>(
        '/users/cancel-delete-account',
        {
          method: 'POST',
          body: JSON.stringify({
            password: cancelDeletePassword,
          }),
        },
        true
      )

      setProfile((prev) => {
        if (!prev) return prev
        const next = { ...prev, accountDeletionScheduledFor: null }
        updateStoredUser(next)
        return next
      })
      setCancelDeletePassword('')
      toast.success(data.message || 'Account deletion canceled.')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not cancel account deletion.'
      toast.error(message)
    } finally {
      setIsCancelingDeletion(false)
    }
  }

  const handleSetupTwoFactor = async () => {
    setIsProcessingTwoFa(true)
    try {
      const data = await apiRequest<{
        secret: string
        qrCodeDataUrl: string
      }>(
        '/auth/2fa/setup',
        { method: 'POST' },
        true
      )

      setTwoFaSecret(data.secret)
      setTwoFaQrCodeDataUrl(data.qrCodeDataUrl)
      setTwoFaEnableCode('')
      setTwoFaRecoveryCode('')
      toast.success('Scan the QR code, then submit the 6-digit code.')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not initialize 2FA setup.'
      toast.error(message)
    } finally {
      setIsProcessingTwoFa(false)
    }
  }

  const handleEnableTwoFactor = async () => {
    if (twoFaEnableCode.trim().length !== 6) {
      toast.error('Enter a valid 6-digit 2FA code.')
      return
    }

    setIsProcessingTwoFa(true)
    try {
      const data = await apiRequest<{ message: string; recoveryCode: string }>(
        '/auth/2fa/enable',
        {
          method: 'POST',
          body: JSON.stringify({ code: twoFaEnableCode.trim() }),
        },
        true
      )

      setTwoFaRecoveryCode(data.recoveryCode)
      setTwoFaSecret('')
      setTwoFaQrCodeDataUrl('')
      setTwoFaEnableCode('')
      setProfile((prev) => {
        if (!prev) return prev
        const next = { ...prev, twoFactorEnabled: true }
        updateStoredUser(next)
        return next
      })
      toast.success(data.message || 'Two-factor authentication enabled.')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not enable two-factor authentication.'
      toast.error(message)
    } finally {
      setIsProcessingTwoFa(false)
    }
  }

  const handleDisableTwoFactor = async () => {
    if (!twoFaDisablePassword.trim()) {
      toast.error('Enter your password.')
      return
    }
    if (!twoFaDisableCode.trim() && !twoFaDisableRecoveryCode.trim()) {
      toast.error('Provide a 2FA code or recovery code.')
      return
    }

    setIsProcessingTwoFa(true)
    try {
      const data = await apiRequest<{ message: string }>(
        '/auth/2fa/disable',
        {
          method: 'POST',
          body: JSON.stringify({
            password: twoFaDisablePassword,
            code: twoFaDisableCode.trim() || undefined,
            recoveryCode: twoFaDisableRecoveryCode.trim() || undefined,
          }),
        },
        true
      )

      clearAuthData()
      toast.success(data.message || '2FA disabled. Please log in again.')
      navigate('/auth?mode=login', { replace: true })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not disable two-factor authentication.'
      toast.error(message)
    } finally {
      setIsProcessingTwoFa(false)
    }
  }

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    try {
      const data = await apiRequest<{ message: string }>(
        '/auth/sessions/revoke',
        {
          method: 'POST',
          body: JSON.stringify({ sessionId }),
        },
        true
      )

      toast.success(data.message || 'Session revoked successfully.')
      await loadSessions()

      if (isCurrent) {
        clearAuthData()
        navigate('/auth?mode=login', { replace: true })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not revoke session.'
      toast.error(message)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="home-surface rounded-3xl border border-slate-500/30 p-12 flex items-center justify-center space-x-3 text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-300/30 bg-gradient-to-br from-blue-500/13 via-cyan-500/10 to-slate-900/45 p-6 sm:p-8">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative grid lg:grid-cols-[1.05fr,0.95fr] gap-6 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Account Center</p>
            <h1 className="text-3xl sm:text-4xl text-white mt-2">Manage your profile, security, and preferences.</h1>
            <p className="text-slate-300 mt-3 max-w-2xl">
              Keep your account details up to date, protect access with 2FA, and control notifications.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-5">
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Email</p>
                <p className="text-white font-semibold mt-1">{profile?.emailVerified ? 'Verified' : 'Pending'}</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">2FA</p>
                <p className="text-white font-semibold mt-1">{profile?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Wallet</p>
                <p className="text-white font-semibold mt-1">{isConnected ? 'Connected' : 'Not connected'}</p>
              </div>
            </div>
          </div>
          <div className="home-surface rounded-2xl border border-slate-500/30 overflow-hidden">
            <img
              src={visualAssets.settingsControl.src}
              alt={visualAssets.settingsControl.alt}
              className="h-full min-h-[250px] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="home-surface rounded-2xl border border-slate-500/30 overflow-hidden">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-4 text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-500'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="home-surface rounded-3xl p-8 border border-slate-500/30"
          >
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Profile Settings</h2>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    { key: 'paymentConfirmations', label: 'Payment confirmations', desc: 'Notify me when payments complete' },
                    { key: 'failedTransactions', label: 'Failed transactions', desc: 'Alert me when payments fail' },
                    { key: 'weeklyReports', label: 'Weekly reports', desc: 'Send weekly account summaries' },
                    { key: 'priceAlerts', label: 'Price alerts', desc: 'Notify me of major crypto price moves' },
                    { key: 'securityAlerts', label: 'Security alerts', desc: 'Critical account and login alerts' },
                  ].map((item) => {
                    const key = item.key as keyof typeof notifications
                    return (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-slate-400">{item.desc}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[key]}
                            onChange={(e) => setNotifications((prev) => ({ ...prev, [key]: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Security</h2>

                <div className="p-4 bg-slate-800/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Email verification</span>
                    <span className={`text-sm ${profile?.emailVerified ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {profile?.emailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">KYC status</span>
                    <span className="text-sm text-slate-200 capitalize">{profile?.kycStatus || 'pending'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Two-factor authentication</span>
                    <span className={`text-sm ${profile?.twoFactorEnabled ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {profile?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {!profile?.twoFactorEnabled && (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-cyan-300" />
                      <h3 className="font-semibold">Set up 2FA</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                      Add an authenticator app for stronger account protection.
                    </p>

                    {!twoFaSecret && (
                      <button
                        onClick={handleSetupTwoFactor}
                        disabled={isProcessingTwoFa}
                        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold disabled:opacity-60"
                      >
                        {isProcessingTwoFa ? 'Preparing...' : 'Generate 2FA Secret'}
                      </button>
                    )}

                    {twoFaSecret && (
                      <div className="space-y-4">
                        {twoFaQrCodeDataUrl && (
                          <img
                            src={twoFaQrCodeDataUrl}
                            alt="2FA QR code"
                            className="w-40 h-40 rounded-lg bg-white p-2"
                          />
                        )}
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Manual secret</label>
                          <input
                            value={twoFaSecret}
                            readOnly
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Enter 6-digit code</label>
                          <input
                            value={twoFaEnableCode}
                            onChange={(e) => setTwoFaEnableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono tracking-[0.2em] text-center"
                            placeholder="123456"
                          />
                        </div>
                        <button
                          onClick={handleEnableTwoFactor}
                          disabled={isProcessingTwoFa}
                          className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-60"
                        >
                          {isProcessingTwoFa ? 'Enabling...' : 'Enable 2FA'}
                        </button>
                      </div>
                    )}

                    {twoFaRecoveryCode && (
                      <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4">
                        <p className="text-sm text-amber-200 mb-1">Recovery code (save this now)</p>
                        <p className="font-mono text-amber-100">{twoFaRecoveryCode}</p>
                      </div>
                    )}
                  </div>
                )}

                {profile?.twoFactorEnabled && (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-300" />
                      <h3 className="font-semibold">Disable 2FA</h3>
                    </div>
                    <p className="text-sm text-slate-400">
                      Disabling 2FA revokes active sessions. You will need to sign in again.
                    </p>
                    <input
                      type="password"
                      value={twoFaDisablePassword}
                      onChange={(e) => setTwoFaDisablePassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      value={twoFaDisableCode}
                      onChange={(e) => setTwoFaDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="2FA code (or use recovery code below)"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                    />
                    <input
                      type="text"
                      value={twoFaDisableRecoveryCode}
                      onChange={(e) => setTwoFaDisableRecoveryCode(e.target.value.toUpperCase())}
                      placeholder="Recovery code"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                    <button
                      onClick={handleDisableTwoFactor}
                      disabled={isProcessingTwoFa}
                      className="px-5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold disabled:opacity-60"
                    >
                      {isProcessingTwoFa ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                )}

                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-cyan-300" />
                      <h3 className="font-semibold">Active Sessions</h3>
                    </div>
                    <button
                      onClick={loadSessions}
                      disabled={isLoadingSessions}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 text-sm hover:bg-slate-800 disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-200">
                            {session.isCurrent ? 'Current session' : 'Session'} · {session.userAgent || 'Unknown device'}
                          </p>
                          <p className="text-slate-400">IP: {session.ipAddress || 'Unknown'}</p>
                          <p className="text-slate-400">Last seen: {formatDateTime(session.lastSeenAt)}</p>
                        </div>
                        <button
                          onClick={() => handleRevokeSession(session.id, session.isCurrent)}
                          disabled={Boolean(session.revokedAt)}
                          className="px-4 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {session.revokedAt ? 'Revoked' : (session.isCurrent ? 'Logout This Device' : 'Revoke')}
                        </button>
                      </div>
                    ))}
                    {!sessions.length && (
                      <p className="text-sm text-slate-400">No active sessions found.</p>
                    )}
                  </div>
                </div>

                {profile?.accountDeletionScheduledFor ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-4">
                    <div className="flex items-center space-x-2 text-amber-300">
                      <AlertTriangle className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Account Deletion Scheduled</h3>
                    </div>
                    <p className="text-sm text-amber-100/90">
                      Your account is scheduled for deletion on {formatDateTime(profile.accountDeletionScheduledFor)}.
                      Enter your password below to cancel this request.
                    </p>
                    <input
                      type="password"
                      value={cancelDeletePassword}
                      onChange={(e) => setCancelDeletePassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full px-4 py-3 bg-slate-900 border border-amber-500/40 rounded-xl text-white focus:border-amber-300 transition-colors"
                    />
                    <button
                      onClick={handleCancelAccountDeletion}
                      disabled={isCancelingDeletion}
                      className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-500 transition-colors disabled:opacity-60"
                    >
                      <span>{isCancelingDeletion ? 'Canceling...' : 'Cancel Scheduled Deletion'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 space-y-4">
                    <div className="flex items-center space-x-2 text-red-300">
                      <AlertTriangle className="w-5 h-5" />
                      <h3 className="text-lg font-semibold">Danger Zone</h3>
                    </div>

                    <p className="text-sm text-red-200/90">
                      Deleting your account schedules permanent removal after a 24-hour safety window.
                      You will be signed out immediately. If you sign back in within 24 hours, deletion is canceled automatically.
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-red-200 mb-2">Type DELETE to confirm</label>
                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE"
                        className="w-full px-4 py-3 bg-slate-900 border border-red-500/40 rounded-xl text-white focus:border-red-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-200 mb-2">Current password</label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 bg-slate-900 border border-red-500/40 rounded-xl text-white focus:border-red-400 transition-colors"
                      />
                    </div>

                    <button
                      onClick={handleScheduleAccountDeletion}
                      disabled={isDeleting}
                      className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isDeleting ? 'Scheduling deletion...' : 'Schedule account deletion'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'wallets' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Connected Wallets</h2>

                {isConnected && address ? (
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-emerald-500/30">
                    <div>
                      <div className="font-medium">{networkName}</div>
                      <div className="text-sm text-slate-400 font-mono">{address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 text-sm">Connected</div>
                      <div className="text-slate-300 text-sm">{Number(balance || '0').toFixed(4)} ETH</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/50 rounded-xl text-slate-400">
                    No wallet connected. Use the Connect Wallet button in the navbar.
                  </div>
                )}
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Preferences</h2>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Currency</label>
                    <select
                      value={preferredCurrency}
                      onChange={(e) => setPreferredCurrency(e.target.value as 'USD' | 'EUR' | 'GBP')}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Timezone</label>
                    <input
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="UTC"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
              {saved ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 text-emerald-400"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Changes saved successfully!</span>
                </motion.div>
              ) : (
                <div />
              )}
              {canSaveProfileSettings ? (
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              ) : (
                <div />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
