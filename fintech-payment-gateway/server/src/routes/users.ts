import express, { Response } from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { config } from '../config/env'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { strictRateLimiter } from '../middleware/rateLimiter'
import { requireRecaptcha } from '../middleware/recaptcha'
import { forwardSalesLeadToCrm } from '../services/crmProvider'
import { Session } from '../utils/database'
import {
  sendAccountDeletionCanceledEmail,
  sendAccountDeletionScheduledEmail,
  sendSalesInquiryAcknowledgementEmail,
  sendSalesInquiryEmail,
} from '../utils/email'
import { logger } from '../utils/logger'

const router = express.Router()

function getPrimaryClientUrl(): string {
  const candidates = config.clientUrl
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  const preferred = candidates.find((entry) => {
    try {
      const hostname = new URL(entry).hostname.toLowerCase()
      return !hostname.endsWith('.netlify.app') && !hostname.endsWith('.netlify.com')
    } catch {
      return !/netlify/i.test(entry)
    }
  })

  return preferred || 'http://localhost:5173'
}

function formatUser(user: any) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role || 'user',
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

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  res.json({
    user: formatUser(req.user),
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
    user: formatUser(req.user),
  })
}))

async function scheduleAccountDeletion(req: any, res: Response): Promise<void> {
  const password = String(req.body.password || '')
  const isValidPassword = await bcrypt.compare(password, req.user.password)
  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid password.' })
    return
  }

  if (req.user.accountDeletionScheduledFor) {
    res.json({
      message: `Account deletion is already scheduled. You will be signed out now. Sign back in within ${config.accountDeletionGraceHours} hour(s) to cancel automatically.`,
      scheduledFor: req.user.accountDeletionScheduledFor,
      shouldSignOut: true,
    })
    return
  }

  const now = new Date()
  const scheduledFor = new Date(now.getTime() + config.accountDeletionGraceHours * 60 * 60 * 1000)

  req.user.accountDeletionRequestedAt = now
  req.user.accountDeletionScheduledFor = scheduledFor
  req.user.accountDeletionTokenHash = null
  await req.user.save()
  await Session.updateMany({ userId: req.user._id, revokedAt: null }, { $set: { revokedAt: new Date() } })

  try {
    const loginLink = `${getPrimaryClientUrl().replace(/\/$/, '')}/auth?mode=login`
    await sendAccountDeletionScheduledEmail(
      req.user.email,
      req.user.firstName,
      scheduledFor,
      loginLink
    )
  } catch (error: any) {
    logger.error(`Failed to send deletion schedule email for ${req.user.email}: ${error.message}`)
  }

  logger.warn(`Account deletion scheduled for ${req.user.email} at ${scheduledFor.toISOString()}`)
  res.json({
    message: `Account deletion scheduled and you have been signed out. If you sign back in within ${config.accountDeletionGraceHours} hour(s), deletion will be canceled automatically.`,
    scheduledFor,
    shouldSignOut: true,
  })
}

// Schedule account deletion with grace window
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

  await scheduleAccountDeletion(req, res)
}))

// Alias endpoint for clients that avoid DELETE request bodies
router.post('/delete-account', authenticateToken, strictRateLimiter, [
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

  await scheduleAccountDeletion(req, res)
}))

// Cancel scheduled account deletion
router.post('/cancel-delete-account', authenticateToken, strictRateLimiter, [
  body('password').isLength({ min: 8 }),
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Provide your password to cancel account deletion.',
      errors: errors.array(),
    })
  }

  if (!req.user.accountDeletionScheduledFor) {
    return res.status(400).json({ error: 'No account deletion is currently scheduled.' })
  }

  const password = String(req.body.password || '')
  const isValidPassword = await bcrypt.compare(password, req.user.password)
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid password.' })
  }

  req.user.accountDeletionRequestedAt = null
  req.user.accountDeletionScheduledFor = null
  req.user.accountDeletionTokenHash = null
  await req.user.save()

  try {
    await sendAccountDeletionCanceledEmail(req.user.email, req.user.firstName, 'manual')
  } catch (error: any) {
    logger.error(`Failed to send deletion cancellation email for ${req.user.email}: ${error.message}`)
  }

  logger.info(`Account deletion canceled for ${req.user.email}`)
  res.json({ message: 'Scheduled account deletion has been canceled.' })
}))

router.post('/contact-sales', strictRateLimiter, requireRecaptcha('contact_sales'), [
  body('fullName').trim().isLength({ min: 2, max: 120 }),
  body('workEmail').isEmail().normalizeEmail(),
  body('companyName').trim().isLength({ min: 2, max: 160 }),
  body('role').trim().isLength({ min: 2, max: 120 }),
  body('country').trim().isLength({ min: 2, max: 80 }),
  body('monthlyVolume').trim().isLength({ min: 2, max: 80 }),
  body('preferredContact').trim().isIn(['Email', 'Phone', 'WhatsApp', 'Telegram']),
  body('message').trim().isLength({ min: 10, max: 2000 }),
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Please provide valid contact details.',
      errors: errors.array(),
    })
  }

  const payload = {
    fullName: String(req.body.fullName || '').trim(),
    workEmail: String(req.body.workEmail || '').trim().toLowerCase(),
    companyName: String(req.body.companyName || '').trim(),
    role: String(req.body.role || '').trim(),
    country: String(req.body.country || '').trim(),
    monthlyVolume: String(req.body.monthlyVolume || '').trim(),
    preferredContact: String(req.body.preferredContact || '').trim(),
    message: String(req.body.message || '').trim(),
    sourcePath: String(req.body.sourcePath || '/contact-sales').trim().slice(0, 160),
    referrer: String(req.headers.referer || req.headers.referrer || '').trim().slice(0, 300),
    userAgent: String(req.headers['user-agent'] || '').trim().slice(0, 300),
    ipAddress: String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim().slice(0, 64),
    submittedAt: new Date().toISOString(),
  }

  try {
    await sendSalesInquiryEmail(payload)
  } catch (error: any) {
    logger.error(`Failed to deliver contact-sales request for ${payload.workEmail}: ${error.message}`)
  }

  try {
    await sendSalesInquiryAcknowledgementEmail(payload)
  } catch (error: any) {
    logger.error(`Failed to send contact-sales acknowledgement for ${payload.workEmail}: ${error.message}`)
  }

  try {
    const crmResult = await forwardSalesLeadToCrm(payload)
    if (crmResult.successfulProviders.length > 0) {
      logger.info(
        `Contact-sales CRM sync succeeded for ${payload.workEmail} via ${crmResult.successfulProviders.join(', ')}`
      )
    } else if (crmResult.attemptedProviders.length > 0) {
      logger.warn(
        `Contact-sales CRM sync had no success for ${payload.workEmail}. Failed: ${crmResult.failedProviders.map((item) => `${item.provider}: ${item.reason}`).join(' | ')}`
      )
    }
  } catch (error: any) {
    logger.error(`Contact-sales CRM sync failed for ${payload.workEmail}: ${error.message}`)
  }

  logger.info(`Contact sales request submitted: ${payload.workEmail} (${payload.companyName})`)
  res.status(202).json({
    message: 'Thanks, your request has been submitted. Our sales team will reach out shortly.',
  })
}))

export default router
