import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle, Lock, Mail, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../utils/api'
import { AuthUser, setAuthData } from '../utils/auth'

type AuthMode = 'login' | 'register'

function getErrorMessage(payload: any): string {
  if (payload?.error && typeof payload.error === 'string') return payload.error
  if (payload?.message && typeof payload.message === 'string') return payload.message
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    return payload.errors[0]?.msg || 'Validation failed'
  }
  return 'Request failed. Please try again.'
}

function persistAuth(data: any) {
  if (data?.token && data?.user) {
    setAuthData(data.token, data.user as AuthUser)
  }
}

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState('')

  const mode = useMemo<AuthMode>(
    () => (searchParams.get('mode') === 'login' ? 'login' : 'register'),
    [searchParams]
  )
  const postAuthRedirect = useMemo(() => {
    const redirect = searchParams.get('redirect')
    if (redirect && redirect.startsWith('/')) {
      return redirect
    }
    return '/dashboard'
  }, [searchParams])

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    setPassword('')
    setConfirmPassword('')
    setOtp('')
    setVerificationEmail('')
  }, [mode])

  const switchMode = (nextMode: AuthMode) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('mode', nextMode)
    setSearchParams(nextParams)
    setOtp('')
    setVerificationEmail('')
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
        if (data?.code === 'EMAIL_NOT_VERIFIED') {
          const emailForVerification = data?.email || email
          setVerificationEmail(emailForVerification)
          setOtp('')
          toast.error('Email verification required. Enter the code sent to your inbox.')
          return
        }

        throw new Error(getErrorMessage(data))
      }

      if (mode === 'register') {
        setVerificationEmail(data?.email || email)
        setOtp('')
        toast.success(data?.message || 'Verification code sent to your email.')
        return
      }

      persistAuth(data)
      toast.success('Logged in successfully.')
      navigate(postAuthRedirect)
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault()

    if (!verificationEmail) {
      toast.error('Verification email is missing.')
      return
    }

    if (otp.trim().length !== 6) {
      toast.error('Enter the 6-digit verification code.')
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationEmail,
          otp: otp.trim(),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(getErrorMessage(data))
      }

      persistAuth(data)
      toast.success('Email verified successfully.')
      navigate(postAuthRedirect)
    } catch (error: any) {
      toast.error(error.message || 'Email verification failed.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (!verificationEmail) {
      toast.error('Verification email is missing.')
      return
    }

    setIsResending(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(getErrorMessage(data))
      }

      toast.success(data?.message || 'Verification code resent.')
    } catch (error: any) {
      toast.error(error.message || 'Could not resend verification code.')
    } finally {
      setIsResending(false)
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
          {!verificationEmail ? (
            <>
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
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start space-x-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold">Verify Your Email</h2>
                  <p className="text-slate-300 text-sm">
                    We sent a 6-digit code to <span className="font-medium">{verificationEmail}</span>.
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Verification Code</label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    minLength={6}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono tracking-[0.35em] text-center text-lg focus:border-emerald-500"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold disabled:opacity-60"
                >
                  <span>{isVerifying ? 'Verifying...' : 'Verify Email'}</span>
                  {!isVerifying && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationEmail('')
                    setOtp('')
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-medium text-slate-300"
                >
                  Use Different Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
