import express, { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

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
    language
  } = req.body as {
    firstName?: string
    lastName?: string
    phone?: string
    preferredCurrency?: string
    timezone?: string
    language?: string
  }

  if (typeof firstName === 'string') req.user.firstName = firstName
  if (typeof lastName === 'string') req.user.lastName = lastName
  if (typeof phone === 'string') req.user.phone = phone
  if (typeof preferredCurrency === 'string') req.user.preferredCurrency = preferredCurrency
  if (typeof timezone === 'string') req.user.timezone = timezone
  if (typeof language === 'string') req.user.language = language
  req.user.updatedAt = new Date()

  await req.user.save()
  logger.info(`User profile updated: ${req.user.email}`)

  res.json({
    message: 'Profile updated successfully.',
    user: formatUser(req.user)
  })
}))

export default router
