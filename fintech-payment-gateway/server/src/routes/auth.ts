import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { body, validationResult } from 'express-validator'
import { config } from '../config/env'
import { User } from '../utils/database'
import { strictRateLimiter } from '../middleware/rateLimiter'
import { asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { sendEmailVerificationOtp } from '../utils/email'

const router = express.Router()

function createOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function createToken(userId: string): string {
  return jwt.sign(
    { userId },
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
    emailVerified: user.emailVerified,
    kycStatus: user.kycStatus,
    walletAddress: user.walletAddress
  }
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

  const hashedPassword = await bcrypt.hash(password, 12)
  const otpCode = createOtpCode()
  const otpHash = hashOtp(otpCode)
  const otpExpiry = new Date(Date.now() + config.emailOtpTtlMinutes * 60 * 1000)

  let user = await User.findOne({ email: normalizedEmail })

  if (user && user.emailVerified) {
    return res.status(409).json({ error: 'User already exists' })
  }

  if (user) {
    user.password = hashedPassword
    user.firstName = firstName
    user.lastName = lastName
    user.emailVerificationOtpHash = otpHash
    user.emailVerificationOtpExpiresAt = otpExpiry
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
    email: user.email
  })
}))

// Login
router.post('/login', strictRateLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body
  const normalizedEmail = String(email).toLowerCase().trim()

  const user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      error: 'Email not verified. Please verify your email before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
      email: user.email
    })
  }

  const token = createToken(String(user._id))

  logger.info(`User logged in: ${normalizedEmail}`)

  res.json({
    token,
    user: formatUser(user)
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
    const token = createToken(String(user._id))
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

  const token = createToken(String(user._id))
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

  const otpCode = createOtpCode()
  user.emailVerificationOtpHash = hashOtp(otpCode)
  user.emailVerificationOtpExpiresAt = new Date(Date.now() + config.emailOtpTtlMinutes * 60 * 1000)
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
    email: user.email
  })
}))

// Verify KYC (mock implementation)
router.post('/verify-kyc', asyncHandler(async (req: Request, res: Response) => {
  const { userId, documentType, documentNumber } = req.body

  // In production, integrate with KYC provider like Onfido, Jumio, etc.
  // This is a mock implementation

  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Simulate KYC verification
  user.kycStatus = 'verified'
  await user.save()

  logger.info(`KYC verified for user: ${user.email}`)

  res.json({
    message: 'KYC verification completed',
    kycStatus: user.kycStatus
  })
}))

export default router
