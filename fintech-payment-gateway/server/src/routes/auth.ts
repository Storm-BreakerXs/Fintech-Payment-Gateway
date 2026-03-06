import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { body, validationResult } from 'express-validator'
import { config } from '../config/env'
import { Session, User } from '../utils/database'
import { strictRateLimiter } from '../middleware/rateLimiter'
import { asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import {
  sendEmailVerificationOtp,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../utils/email'
import { authenticateToken } from '../middleware/auth'
import { decrypt, encrypt, hashData } from '../utils/encryption'
import { verifyKycWithProvider } from '../services/kycProvider'

const router = express.Router()

function createOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function getOtpCooldownRemainingSeconds(lastSentAt: Date | null | undefined): number {
  if (!lastSentAt) {
    return 0
  }

  const elapsedSeconds = Math.floor((Date.now() - new Date(lastSentAt).getTime()) / 1000)
  return Math.max(config.otpResendCooldownSeconds - elapsedSeconds, 0)
}

function createToken(userId: string, sessionId?: string): string {
  return jwt.sign(
    { userId, ...(sessionId ? { sid: sessionId } : {}) },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
}

function formatUser(user: any) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    preferredCurrency: user.preferredCurrency || 'USD',
    timezone: user.timezone || 'UTC',
    language: user.language || 'en',
    notificationSettings: user.notificationSettings || {
      paymentConfirmations: true,
      failedTransactions: true,
      weeklyReports: false,
      priceAlerts: true,
      securityAlerts: true,
    },
    emailVerified: user.emailVerified,
    kycStatus: user.kycStatus,
    walletAddress: user.walletAddress,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    accountDeletionScheduledFor: user.accountDeletionScheduledFor,
  }
}

function getPrimaryClientUrl(): string {
  return config.clientUrl.split(',')[0]?.trim() || 'http://localhost:5173'
}

function normalizeRecoveryCode(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

function createRecoveryCode(): string {
  return `${crypto.randomBytes(3).toString('hex')}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase()
}

async function createSessionToken(req: Request, userId: string): Promise<string> {
  const sessionId = crypto.randomUUID()
  await Session.create({
    userId,
    tokenId: sessionId,
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || '',
  })

  return createToken(userId, sessionId)
}

async function verifyTwoFactor(user: any, twoFactorCode?: string, recoveryCode?: string): Promise<{ ok: boolean; recoveryCodeRotated?: string }> {
  if (!user.twoFactorEnabled) {
    return { ok: true }
  }

  const secretEncrypted = user.twoFactorSecretEncrypted
  if (!secretEncrypted) {
    return { ok: false }
  }

  const secret = decrypt(secretEncrypted)
  if (!secret) {
    return { ok: false }
  }

  const sanitizedCode = String(twoFactorCode || '').trim().replace(/\s+/g, '')
  if (sanitizedCode) {
    const totpValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: sanitizedCode,
      window: 1,
    })
    if (totpValid) {
      return { ok: true }
    }
  }

  const normalizedRecovery = normalizeRecoveryCode(String(recoveryCode || ''))
  if (normalizedRecovery && user.twoFactorRecoveryCodeHash === hashData(normalizedRecovery)) {
    const nextRecoveryCode = createRecoveryCode()
    user.twoFactorRecoveryCodeHash = hashData(nextRecoveryCode)
    await user.save()
    return { ok: true, recoveryCodeRotated: nextRecoveryCode }
  }

  return { ok: false }
}

// Register
router.post('/register', strictRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password, firstName, lastName } = req.body
  const normalizedEmail = String(email).toLowerCase().trim()

  let user = await User.findOne({ email: normalizedEmail })

  if (user && user.emailVerified) {
    return res.status(409).json({ error: 'User already exists' })
  }

  const cooldownRemainingSeconds = getOtpCooldownRemainingSeconds(user?.emailVerificationOtpLastSentAt)
  if (cooldownRemainingSeconds > 0) {
    return res.status(429).json({
      error: 'Please wait before requesting another verification code.',
      code: 'OTP_RESEND_COOLDOWN',
      retryAfterSeconds: cooldownRemainingSeconds,
    })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const otpCode = createOtpCode()
  const otpHash = hashOtp(otpCode)
  const otpExpiry = new Date(Date.now() + config.emailOtpTtlMinutes * 60 * 1000)
  const otpIssuedAt = new Date()

  if (user) {
    user.password = hashedPassword
    user.firstName = firstName
    user.lastName = lastName
    user.emailVerificationOtpHash = otpHash
    user.emailVerificationOtpExpiresAt = otpExpiry
    user.emailVerificationOtpLastSentAt = otpIssuedAt
    user.emailVerificationAttempts = 0
  } else {
    user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerified: false,
      emailVerificationOtpHash: otpHash,
      emailVerificationOtpExpiresAt: otpExpiry,
      emailVerificationOtpLastSentAt: otpIssuedAt,
      emailVerificationAttempts: 0,
    })
  }

  await user.save()
  try {
    await sendEmailVerificationOtp(user.email, user.firstName, otpCode)
  } catch (error: any) {
    logger.error(`Failed to send verification OTP for ${user.email}: ${error.message}`)
    return res.status(503).json({
      error: 'Unable to send verification email.',
      message: 'Email provider is unavailable. Please try again shortly.'
    })
  }

  logger.info(`Verification OTP sent for registration: ${user.email}`)

  res.status(201).json({
    message: 'Verification code sent to your email address.',
    requiresEmailVerification: true,
    email: user.email,
    retryAfterSeconds: config.otpResendCooldownSeconds,
  })
}))

// Login
router.post('/login', strictRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('twoFactorCode').optional().isLength({ min: 6, max: 6 }),
  body('recoveryCode').optional().isString(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password, twoFactorCode, recoveryCode } = req.body
  const normalizedEmail = String(email).toLowerCase().trim()

  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  if (!user.emailVerified) {
    const cooldownRemainingSeconds = getOtpCooldownRemainingSeconds(user.emailVerificationOtpLastSentAt)
    return res.status(403).json({
      error: 'Email not verified. Please verify your email before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email,
      retryAfterSeconds: cooldownRemainingSeconds,
    })
  }

  const twoFactorResult = await verifyTwoFactor(user, twoFactorCode, recoveryCode)
  if (!twoFactorResult.ok) {
    return res.status(401).json({
      error: user.twoFactorEnabled
        ? 'Two-factor authentication required or invalid code.'
        : 'Invalid credentials',
      code: 'TWO_FACTOR_REQUIRED',
    })
  }

  const token = await createSessionToken(req, String(user._id))

  logger.info(`User logged in: ${normalizedEmail}`)

  res.json({
    token,
    user: formatUser(user),
    ...(twoFactorResult.recoveryCodeRotated ? { recoveryCodeRotated: twoFactorResult.recoveryCodeRotated } : {}),
  })
}))

// Verify email via OTP
router.post('/verify-email', strictRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const normalizedEmail = String(req.body.email).toLowerCase().trim()
  const otp = String(req.body.otp).trim()
  const otpHash = hashOtp(otp)

  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.emailVerified) {
    const token = await createSessionToken(req, String(user._id))
    return res.json({
      message: 'Email already verified.',
      token,
      user: formatUser(user)
    })
  }

  if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
    return res.status(400).json({
      error: 'Verification code has not been requested.',
      code: 'OTP_NOT_REQUESTED'
    })
  }

  if (new Date(user.emailVerificationOtpExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({
      error: 'Verification code has expired. Request a new code.',
      code: 'OTP_EXPIRED'
    })
  }

  if (user.emailVerificationOtpHash !== otpHash) {
    user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1
    await user.save()

    return res.status(400).json({
      error: 'Invalid verification code.',
      code: 'OTP_INVALID'
    })
  }

  user.emailVerified = true
  user.emailVerificationOtpHash = null
  user.emailVerificationOtpExpiresAt = null
  user.emailVerificationAttempts = 0
  await user.save()

  try {
    await sendWelcomeEmail(user.email, user.firstName)
  } catch (error: any) {
    logger.error(`Failed to send welcome email for ${user.email}: ${error.message}`)
  }

  const token = await createSessionToken(req, String(user._id))
  logger.info(`Email verified: ${user.email}`)

  res.json({
    message: 'Email verified successfully.',
    token,
    user: formatUser(user)
  })
}))

// Resend verification OTP
router.post('/resend-verification', strictRateLimiter, [
  body('email').isEmail().normalizeEmail()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const normalizedEmail = String(req.body.email).toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.emailVerified) {
    return res.status(400).json({ error: 'Email is already verified.' })
  }

  const cooldownRemainingSeconds = getOtpCooldownRemainingSeconds(user.emailVerificationOtpLastSentAt)
  if (cooldownRemainingSeconds > 0) {
    return res.status(429).json({
      error: 'Please wait before requesting another verification code.',
      code: 'OTP_RESEND_COOLDOWN',
      retryAfterSeconds: cooldownRemainingSeconds,
    })
  }

  const otpCode = createOtpCode()
  user.emailVerificationOtpHash = hashOtp(otpCode)
  user.emailVerificationOtpExpiresAt = new Date(Date.now() + config.emailOtpTtlMinutes * 60 * 1000)
  user.emailVerificationOtpLastSentAt = new Date()
  user.emailVerificationAttempts = 0
  await user.save()

  try {
    await sendEmailVerificationOtp(user.email, user.firstName, otpCode)
  } catch (error: any) {
    logger.error(`Failed to resend verification OTP for ${user.email}: ${error.message}`)
    return res.status(503).json({
      error: 'Unable to resend verification email.',
      message: 'Email provider is unavailable. Please try again shortly.'
    })
  }

  logger.info(`Verification OTP resent: ${user.email}`)

  res.json({
    message: 'A new verification code has been sent.',
    email: user.email,
    retryAfterSeconds: config.otpResendCooldownSeconds,
  })
}))

// Request password reset
router.post('/forgot-password', strictRateLimiter, [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const normalizedEmail = String(req.body.email).toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail })

  if (user) {
    const resetCode = createOtpCode()
    user.passwordResetTokenHash = hashOtp(resetCode)
    user.passwordResetExpiresAt = new Date(Date.now() + config.passwordResetTtlMinutes * 60 * 1000)
    await user.save()

    const resetLink = `${getPrimaryClientUrl()}/auth?mode=reset&email=${encodeURIComponent(user.email)}&code=${encodeURIComponent(resetCode)}`

    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetCode, resetLink)
    } catch (error: any) {
      logger.error(`Failed to send password reset email for ${user.email}: ${error.message}`)
    }
  }

  res.json({
    message: 'If that email exists, a password reset code has been sent.',
  })
}))

// Reset password
router.post('/reset-password', strictRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  body('newPassword').isLength({ min: 8 }),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const normalizedEmail = String(req.body.email).toLowerCase().trim()
  const code = String(req.body.code).trim()
  const newPassword = String(req.body.newPassword)

  const user = await User.findOne({ email: normalizedEmail })
  if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
    return res.status(400).json({ error: 'Invalid or expired reset code.' })
  }

  if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Reset code has expired.' })
  }

  if (user.passwordResetTokenHash !== hashOtp(code)) {
    return res.status(400).json({ error: 'Invalid reset code.' })
  }

  user.password = await bcrypt.hash(newPassword, 12)
  user.passwordResetTokenHash = null
  user.passwordResetExpiresAt = null
  await user.save()

  await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } })

  res.json({ message: 'Password reset successful. Please log in again.' })
}))

// Logout current session
router.post('/logout', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  if (req.session) {
    req.session.revokedAt = new Date()
    await req.session.save()
  }

  res.json({ message: 'Logged out successfully.' })
}))

// List sessions
router.get('/sessions', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const sessions = await Session.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)

  res.json({
    sessions: sessions.map((session) => ({
      id: session.tokenId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      revokedAt: session.revokedAt,
      lastSeenAt: session.lastSeenAt,
      createdAt: session.createdAt,
      isCurrent: req.session?.tokenId === session.tokenId,
    })),
  })
}))

// Revoke session
router.post('/sessions/revoke', authenticateToken, [
  body('sessionId').trim().notEmpty(),
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const sessionId = String(req.body.sessionId).trim()
  const session = await Session.findOne({ tokenId: sessionId, userId: req.user._id })
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' })
  }

  session.revokedAt = new Date()
  await session.save()

  res.json({ message: 'Session revoked successfully.' })
}))

// Setup 2FA
router.post('/2fa/setup', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  if (req.user.twoFactorEnabled) {
    return res.status(400).json({ error: 'Two-factor authentication is already enabled.' })
  }

  const secret = speakeasy.generateSecret({
    name: `FinPay (${req.user.email})`,
    issuer: 'FinPay',
    length: 32,
  })

  req.user.twoFactorTempSecretEncrypted = encrypt(secret.base32)
  await req.user.save()

  const qrCodeDataUrl = secret.otpauth_url
    ? await QRCode.toDataURL(secret.otpauth_url)
    : ''

  res.json({
    message: 'Scan the QR code and submit a 6-digit code to enable 2FA.',
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeDataUrl,
  })
}))

// Enable 2FA
router.post('/2fa/enable', authenticateToken, [
  body('code').isLength({ min: 6, max: 6 }),
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const encryptedSecret = req.user.twoFactorTempSecretEncrypted
  if (!encryptedSecret) {
    return res.status(400).json({ error: '2FA setup has not been initialized.' })
  }

  const secret = decrypt(encryptedSecret)
  const isValid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(req.body.code).trim(),
    window: 1,
  })

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid 2FA code.' })
  }

  const recoveryCode = createRecoveryCode()
  req.user.twoFactorEnabled = true
  req.user.twoFactorSecretEncrypted = encrypt(secret)
  req.user.twoFactorTempSecretEncrypted = null
  req.user.twoFactorRecoveryCodeHash = hashData(normalizeRecoveryCode(recoveryCode))
  await req.user.save()

  res.json({
    message: 'Two-factor authentication enabled successfully.',
    recoveryCode,
  })
}))

// Disable 2FA
router.post('/2fa/disable', authenticateToken, [
  body('password').isLength({ min: 8 }),
  body('code').optional().isString(),
  body('recoveryCode').optional().isString(),
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  if (!req.user.twoFactorEnabled) {
    return res.status(400).json({ error: 'Two-factor authentication is not enabled.' })
  }

  const isValidPassword = await bcrypt.compare(String(req.body.password), req.user.password)
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid password.' })
  }

  const twoFactorResult = await verifyTwoFactor(req.user, req.body.code, req.body.recoveryCode)
  if (!twoFactorResult.ok) {
    return res.status(400).json({ error: 'Invalid 2FA code.' })
  }

  req.user.twoFactorEnabled = false
  req.user.twoFactorSecretEncrypted = null
  req.user.twoFactorTempSecretEncrypted = null
  req.user.twoFactorRecoveryCodeHash = null
  await req.user.save()

  await Session.updateMany({ userId: req.user._id, revokedAt: null }, { $set: { revokedAt: new Date() } })

  res.json({ message: 'Two-factor authentication disabled. Please log in again.' })
}))

// Verify KYC via configured provider
router.post('/verify-kyc', authenticateToken, [
  body('documentType').trim().notEmpty(),
  body('documentNumber').trim().notEmpty(),
  body('country').optional().trim().isLength({ min: 2, max: 2 }),
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { documentType, documentNumber, country } = req.body as {
    documentType: string
    documentNumber: string
    country?: string
  }

  const result = await verifyKycWithProvider({
    userId: String(req.user._id),
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    documentType,
    documentNumber,
    country,
  })

  req.user.kycStatus = result.status
  req.user.kycProviderReference = result.providerReference || ''
  await req.user.save()

  logger.info(`KYC processed for user: ${req.user.email}, status=${result.status}`)

  res.json({
    message: 'KYC verification processed.',
    kycStatus: req.user.kycStatus,
    providerReference: req.user.kycProviderReference,
  })
}))

export default router
