import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Lock, Mail, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'

type AuthMode = 'login' | 'register'

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV
    ? 'http://localhost:3001/api'
    : 'https://fintech-payment-gateway.onrender.com/api')

function getErrorMessage(payload: any): string {
  if (payload?.error && typeof payload.error === 'string') return payload.error
  if (payload?.message && typeof payload.message === 'string') return payload.message
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors[0]?.msg || 'Validation failed'
  }
  return 'Request failed. Please try again.'
}

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mode = useMemo<AuthMode>(
    () => (searchParams.get('mode') === 'login' ? 'login' : 'register'),
    [searchParams]
  )

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    setPassword('')
    setConfirmPassword('')
  }, [mode])

  const switchMode = (nextMode: AuthMode) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('mode', nextMode)
    setSearchParams(nextParams)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (mode === 'register' && password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    const endpoint = mode === 'register' ? '/auth/register' : '/auth/login'
    const payload = mode === 'register'
      ? { firstName, lastName, email, password }
      : { email, password }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(getErrorMessage(data))
      }

      if (data?.token) {
        localStorage.setItem('finpay_token', data.token)
      }
      if (data?.user) {
        localStorage.setItem('finpay_user', JSON.stringify(data.user))
      }

      toast.success(mode === 'register' ? 'Account created successfully.' : 'Logged in successfully.')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
        <div className="glass rounded-2xl border border-slate-700 p-6 sm:p-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mb-5">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-300 mb-8">
            {mode === 'register'
              ? 'Set up your FinPay merchant account to start accepting payments.'
              : 'Sign in to manage payments, monitor transactions, and update settings.'}
          </p>

          <div className="space-y-4 text-slate-300">
            <div className="flex items-start space-x-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <span>Secure authentication and encrypted session handling.</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <span>Unified dashboard for card and crypto payment operations.</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <span>Developer-ready API workflow for production integration.</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl border border-slate-700 p-6 sm:p-10">
          <div className="flex rounded-xl p-1 bg-slate-800/80 border border-slate-700 mb-6">
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">First Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                      placeholder="Jane"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Last Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm text-slate-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}</span>
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-sm text-slate-400 mt-6">
            {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link
              to={mode === 'register' ? '/auth?mode=login' : '/auth?mode=register'}
              className="text-emerald-400 hover:text-emerald-300"
            >
              {mode === 'register' ? 'Login here' : 'Create one now'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
