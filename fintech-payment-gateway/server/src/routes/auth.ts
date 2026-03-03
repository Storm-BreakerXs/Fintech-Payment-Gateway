import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { config } from '../config/env'
import { User } from '../utils/database'
import { strictRateLimiter } from '../middleware/rateLimiter'
import { asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

const router = express.Router()

// Register
router.post('/register', [
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

  // Check if user exists
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' })
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = new User({
    email,
    password: hashedPassword,
    firstName,
    lastName
  })

  await user.save()

  // Generate token
  const token = jwt.sign(
    { userId: user._id },
    config.jwtSecret,
    { expiresIn: '7d' }
  )

  logger.info(`New user registered: ${email}`)

  res.status(201).json({
    message: 'User created successfully',
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      kycStatus: user.kycStatus
    }
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

  // Find user
  const user = await User.findOne({ email })
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Generate token
  const token = jwt.sign(
    { userId: user._id },
    config.jwtSecret,
    { expiresIn: '7d' }
  )

  logger.info(`User logged in: ${email}`)

  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      kycStatus: user.kycStatus,
      walletAddress: user.walletAddress
    }
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
