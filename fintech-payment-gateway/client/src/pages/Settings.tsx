import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Bell,
  Shield,
  Wallet,
  Globe,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useWeb3Store } from '../hooks/useWeb3'
import { apiRequest } from '../utils/api'
import { AuthUser, clearAuthData, updateStoredUser } from '../utils/auth'

type SettingsSection = 'profile' | 'notifications' | 'security' | 'wallets' | 'preferences'

interface MeResponse {
  user: AuthUser
}

const settingsSections: Array<{ id: SettingsSection; label: string; icon: typeof User }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'wallets', label: 'Connected Wallets', icon: Wallet },
  { id: 'preferences', label: 'Preferences', icon: Globe },
]

export default function Settings() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [profile, setProfile] = useState<AuthUser | null>(null)

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

  const { isConnected, address, balance, chainId } = useWeb3Store()

  useEffect(() => {
    async function loadProfile() {
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
    }

    loadProfile()
  }, [])

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

  const handleDeleteAccount = async () => {
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
      const data = await apiRequest<{ message: string }>(
        '/users/me',
        {
          method: 'DELETE',
          body: JSON.stringify({
            password: deletePassword,
            confirmation: 'DELETE',
          }),
        },
        true
      )

      clearAuthData()
      toast.success(data.message || 'Account deleted successfully.')
      navigate('/auth', { replace: true })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not delete account.'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass rounded-2xl border border-slate-700 p-12 flex items-center justify-center space-x-3 text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl border border-slate-700 overflow-hidden">
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
            className="glass rounded-2xl p-8 border border-slate-700"
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
                </div>

                <p className="text-sm text-slate-400">
                  Password reset and session management endpoints can be added next if you want advanced security controls.
                </p>

                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-red-300">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Danger Zone</h3>
                  </div>

                  <p className="text-sm text-red-200/90">
                    Deleting your account is permanent. Your profile, saved payment methods, and transaction history in this app will be removed.
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
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? 'Deleting account...' : 'Delete my account'}</span>
                  </button>
                </div>
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
