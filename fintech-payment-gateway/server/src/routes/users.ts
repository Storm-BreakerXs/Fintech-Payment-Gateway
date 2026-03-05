import express, { Response } from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { strictRateLimiter } from '../middleware/rateLimiter'
import { logger } from '../utils/logger'
import { PaymentMethod, Transaction, User } from '../utils/database'

const router = express.Router()

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
  }
}

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  res.json({
    user: formatUser(req.user)
  })
}))

// Update current user profile
router.patch('/me', authenticateToken, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim().isLength({ min: 7, max: 20 }),
  body('preferredCurrency').optional().isIn(['USD', 'EUR', 'GBP']),
  body('timezone').optional().trim().isLength({ min: 2, max: 80 }),
  body('language').optional().trim().isLength({ min: 2, max: 10 }),
  body('notificationSettings').optional().isObject(),
  body('notificationSettings.paymentConfirmations').optional().isBoolean(),
  body('notificationSettings.failedTransactions').optional().isBoolean(),
  body('notificationSettings.weeklyReports').optional().isBoolean(),
  body('notificationSettings.priceAlerts').optional().isBoolean(),
  body('notificationSettings.securityAlerts').optional().isBoolean(),
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const {
    firstName,
    lastName,
    phone,
    preferredCurrency,
    timezone,
    language,
    notificationSettings,
  } = req.body as {
    firstName?: string
    lastName?: string
    phone?: string
    preferredCurrency?: string
    timezone?: string
    language?: string
    notificationSettings?: {
      paymentConfirmations?: boolean
      failedTransactions?: boolean
      weeklyReports?: boolean
      priceAlerts?: boolean
      securityAlerts?: boolean
    }
  }

  if (typeof firstName === 'string') req.user.firstName = firstName
  if (typeof lastName === 'string') req.user.lastName = lastName
  if (typeof phone === 'string') req.user.phone = phone
  if (typeof preferredCurrency === 'string') req.user.preferredCurrency = preferredCurrency
  if (typeof timezone === 'string') req.user.timezone = timezone
  if (typeof language === 'string') req.user.language = language
  if (notificationSettings && typeof notificationSettings === 'object') {
    req.user.notificationSettings = {
      ...(req.user.notificationSettings || {}),
      ...notificationSettings,
    }
  }
  req.user.updatedAt = new Date()

  await req.user.save()
  logger.info(`User profile updated: ${req.user.email}`)

  res.json({
    message: 'Profile updated successfully.',
    user: formatUser(req.user)
  })
}))

// Delete current user account
router.delete('/me', authenticateToken, strictRateLimiter, [
  body('password').isLength({ min: 8 }),
  body('confirmation').equals('DELETE'),
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid account deletion request. Provide your password and type DELETE to confirm.',
      errors: errors.array(),
    })
  }

  const password = String(req.body.password || '')
  const isValidPassword = await bcrypt.compare(password, req.user.password)
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid password.' })
  }

  const userId = req.user._id
  const userEmail = req.user.email

  await Promise.all([
    Transaction.deleteMany({ userId }),
    PaymentMethod.deleteMany({ userId }),
    User.findByIdAndDelete(userId),
  ])

  logger.warn(`User account deleted: ${userEmail}`)

  res.json({ message: 'Your account has been permanently deleted.' })
}))

export default router
