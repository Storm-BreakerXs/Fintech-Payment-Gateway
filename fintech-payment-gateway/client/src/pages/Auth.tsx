import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle, Lock, Mail, Shield, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../utils/api'
import { executeRecaptcha, isRecaptchaEnabled } from '../utils/recaptcha'
import { AuthUser, setAuthData } from '../utils/auth'
import { visualAssets } from '../content/visualAssets'

type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

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

function parseAuthMode(value: string | null): AuthMode {
  if (value === 'login' || value === 'register' || value === 'forgot' || value === 'reset') {
    return value
  }
  return 'register'
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
    () => parseAuthMode(searchParams.get('mode')),
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
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  const [forgotEmail, setForgotEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const recaptchaEnabled = isRecaptchaEnabled()

  useEffect(() => {
    if (mode !== 'reset') {
      return
    }

    const queryEmail = searchParams.get('email')
    const queryCode = searchParams.get('code')
    if (queryEmail) setResetEmail(queryEmail)
    if (queryCode) setResetCode(queryCode)
  }, [mode, searchParams])

  useEffect(() => {
    setPassword('')
    setConfirmPassword('')
    setOtp('')
    setVerificationEmail('')
    setRequiresTwoFactor(false)
    setTwoFactorCode('')
    setRecoveryCode('')
  }, [mode])

  const switchMode = (nextMode: AuthMode) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('mode', nextMode)
    if (nextMode !== 'reset') {
      nextParams.delete('code')
    }
    setSearchParams(nextParams)
    setOtp('')
    setVerificationEmail('')
    setRequiresTwoFactor(false)
    setTwoFactorCode('')
    setRecoveryCode('')
  }

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (mode === 'register' && password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const captchaToken = await executeRecaptcha(mode === 'register' ? 'register' : 'login')
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login'
      const payload = mode === 'register'
        ? {
            firstName,
            lastName,
            email,
            password,
            ...(captchaToken ? { captchaToken } : {}),
          }
        : {
            email,
            password,
            ...(requiresTwoFactor && twoFactorCode.trim()
              ? { twoFactorCode: twoFactorCode.trim() }
              : {}),
            ...(requiresTwoFactor && recoveryCode.trim()
              ? { recoveryCode: recoveryCode.trim() }
              : {}),
            ...(captchaToken ? { captchaToken } : {}),
          }

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

        if (data?.code === 'TWO_FACTOR_REQUIRED') {
          setRequiresTwoFactor(true)
          setTwoFactorCode('')
          setRecoveryCode('')
          toast.error('Enter your 2FA code or recovery code to continue.')
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

      setRequiresTwoFactor(false)
      persistAuth(data)
      if (data?.recoveryCodeRotated) {
        toast.success(`Logged in. New recovery code: ${data.recoveryCodeRotated}`)
      } else {
        toast.success('Logged in successfully.')
      }
      if (data?.accountDeletionCanceledOnLogin) {
        toast.success('Your scheduled account deletion has been canceled because you signed in within 24 hours.')
      }
      navigate(postAuthRedirect)
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast.error('Enter your email address.')
      return
    }

    setIsSubmitting(true)
    try {
      const captchaToken = await executeRecaptcha('forgot_password')
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          ...(captchaToken ? { captchaToken } : {}),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(getErrorMessage(data))
      }

      toast.success(data?.message || 'If the email exists, a reset code has been sent.')
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('mode', 'reset')
      nextParams.set('email', forgotEmail.trim())
      nextParams.delete('code')
      setSearchParams(nextParams)
      setResetEmail(forgotEmail.trim())
      setResetCode('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Unable to request password reset.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (resetCode.trim().length !== 6) {
      toast.error('Enter the 6-digit reset code.')
      return
    }

    setIsSubmitting(true)
    try {
      const captchaToken = await executeRecaptcha('reset_password')
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          code: resetCode.trim(),
          newPassword,
          ...(captchaToken ? { captchaToken } : {}),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(getErrorMessage(data))
      }

      toast.success(data?.message || 'Password reset successful. Please log in.')
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('mode', 'login')
      nextParams.delete('code')
      nextParams.delete('email')
      setSearchParams(nextParams)
      setEmail(resetEmail.trim())
      setPassword('')
      setRequiresTwoFactor(false)
      setTwoFactorCode('')
      setRecoveryCode('')
    } catch (error: any) {
      toast.error(error.message || 'Password reset failed.')
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
      const captchaToken = await executeRecaptcha('verify_email')
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationEmail,
          otp: otp.trim(),
          ...(captchaToken ? { captchaToken } : {}),
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
      const captchaToken = await executeRecaptcha('resend_verification')
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationEmail,
          ...(captchaToken ? { captchaToken } : {}),
        }),
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

  const showPrimaryAuthForm = mode === 'login' || mode === 'register'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-cyan-500/12 via-blue-500/10 to-slate-900/40 p-6 sm:p-8">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Secure Access</p>
            <h2 className="text-2xl sm:text-3xl text-white mt-2">Your FinPay account, protected by design.</h2>
            <p className="text-slate-300 mt-2 text-sm sm:text-base">
              Sign in, create an account, or recover access from one secure flow.
            </p>
          </div>
          <div className="home-surface rounded-2xl border border-slate-500/30 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">Security Layers</p>
            <p className="text-white mt-2 text-sm">Email verification, adaptive step-up checks, and secure recovery.</p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
        <div className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-10">
          <img
            src={visualAssets.accountAccess.src}
            alt={visualAssets.accountAccess.alt}
            className="h-44 w-full rounded-2xl object-cover border border-slate-500/25 mb-5"
            loading="lazy"
          />
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center mb-5">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {mode === 'register' && 'Create Your Account'}
            {mode === 'login' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Access'}
            {mode === 'reset' && 'Set New Password'}
          </h1>
          <p className="text-slate-300 mb-8">
            {mode === 'register' && 'Set up your FinPay merchant account to start accepting payments.'}
            {mode === 'login' && 'Sign in to manage payments, monitor transactions, and update settings.'}
            {mode === 'forgot' && 'Request a secure reset code to recover your account password.'}
            {mode === 'reset' && 'Enter the reset code from your inbox and choose a new password.'}
          </p>

          <div className="space-y-4 text-slate-300">
            <div className="flex items-start space-x-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <span>Secure authentication and encrypted session handling.</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <span>Password reset with time-bound verification codes.</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <span>Step-up verification appears only when your account requires it.</span>
            </div>
          </div>
        </div>

        <div className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-10">
          {!verificationEmail ? (
            <>
              {showPrimaryAuthForm && (
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
              )}

              {showPrimaryAuthForm && (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
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

                  {mode === 'login' && requiresTwoFactor && (
                    <div className="space-y-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                      <p className="text-sm text-cyan-100">
                        Extra verification is enabled on this account. Enter a 2FA code or a recovery code.
                      </p>
                      <div>
                        <label className="block text-sm text-slate-300 mb-2">2FA Code</label>
                        <input
                          type="text"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono tracking-[0.2em] text-center focus:border-emerald-500"
                          placeholder="123456"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-2">Recovery Code (alternative)</label>
                        <input
                          type="text"
                          value={recoveryCode}
                          onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                          placeholder="ABC123-DEF456"
                        />
                      </div>
                    </div>
                  )}

                  {mode === 'login' && !requiresTwoFactor && (
                    <p className="text-sm text-slate-400">
                      If your account needs extra verification, we will ask for a code after password check.
                    </p>
                  )}

                  {mode === 'login' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email)
                          switchMode('forgot')
                        }}
                        className="text-sm text-cyan-300 hover:text-cyan-200"
                      >
                        Forgot password?
                      </button>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold disabled:opacity-60"
                  >
                    <span>{isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {recaptchaEnabled && (
                    <p className="text-xs text-slate-400">Protected by reCAPTCHA.</p>
                  )}
                </form>
              )}

              {mode === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold disabled:opacity-60"
                  >
                    <span>{isSubmitting ? 'Please wait...' : 'Send Reset Code'}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {recaptchaEnabled && (
                    <p className="text-xs text-slate-400">Protected by reCAPTCHA.</p>
                  )}
                </form>
              )}

              {mode === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Reset Code</label>
                    <input
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      minLength={6}
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono tracking-[0.35em] text-center text-lg focus:border-emerald-500"
                      placeholder="000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                      placeholder="Minimum 8 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:border-emerald-500"
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold disabled:opacity-60"
                  >
                    <span>{isSubmitting ? 'Please wait...' : 'Reset Password'}</span>
                    {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {recaptchaEnabled && (
                    <p className="text-xs text-slate-400">Protected by reCAPTCHA.</p>
                  )}
                </form>
              )}

              {(mode === 'login' || mode === 'register') && (
                <p className="text-sm text-slate-400 mt-6">
                  {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <Link
                    to={mode === 'register' ? '/auth?mode=login' : '/auth?mode=register'}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    {mode === 'register' ? 'Login here' : 'Create one now'}
                  </Link>
                </p>
              )}

              {(mode === 'forgot' || mode === 'reset') && (
                <p className="text-sm text-slate-400 mt-6">
                  Remembered your password?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    Back to login
                  </button>
                </p>
              )}
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

                {recaptchaEnabled && (
                  <p className="text-xs text-slate-400">Protected by reCAPTCHA.</p>
                )}
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
