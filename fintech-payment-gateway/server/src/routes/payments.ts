import express, { Response } from 'express'
import Stripe from 'stripe'
import { body, validationResult } from 'express-validator'
import { config } from '../config/env'
import { Transaction } from '../utils/database'
import { authenticateToken, requireKyc } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

const router = express.Router()
const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, { apiVersion: '2023-10-16' })
  : null

// Process card payment
router.post('/card', authenticateToken, requireKyc, [
  body('amount').isFloat({ min: 0.01 }),
  body('currency').isIn(['USD', 'EUR', 'GBP']),
  body('paymentMethodId').notEmpty(),
  body('merchantName').optional().trim()
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { amount, currency, paymentMethodId, merchantName } = req.body

  if (!stripe) {
    return res.status(503).json({
      error: 'Card payments are not configured',
      message: 'Missing STRIPE_SECRET_KEY on the server'
    })
  }

  try {
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    })

    const paymentIntentCharges = paymentIntent as any

    // Save transaction to database
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'card',
      amount,
      currency,
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      merchantName,
      stripePaymentIntentId: paymentIntent.id,
      metadata: {
        paymentMethod: paymentIntent.payment_method,
        receiptUrl: paymentIntentCharges.charges?.data?.[0]?.receipt_url
      }
    })

    await transaction.save()

    logger.info(`Card payment processed: ${transaction._id}`)

    res.json({
      success: true,
      transactionId: transaction._id,
      status: transaction.status,
      clientSecret: paymentIntent.client_secret
    })
  } catch (error: any) {
    logger.error('Card payment error:', error)

    // Save failed transaction
    const transaction = new Transaction({
      userId: req.user._id,
      type: 'card',
      amount,
      currency,
      status: 'failed',
      merchantName,
      metadata: { error: error.message }
    })

    await transaction.save()

    res.status(400).json({
      error: 'Payment failed',
      message: error.message
    })
  }
}))

// Process crypto payment
router.post('/crypto', authenticateToken, [
  body('amount').isFloat({ min: 0 }),
  body('currency').notEmpty(),
  body('txHash').notEmpty(),
  body('merchantName').optional().trim()
], asyncHandler(async (req: any, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { amount, currency, txHash, merchantName } = req.body

  // Save transaction (verification happens async)
  const transaction = new Transaction({
    userId: req.user._id,
    type: 'crypto',
    amount,
    currency,
    status: 'pending',
    merchantName,
    txHash,
    metadata: {
      verificationPending: true
    }
  })

  await transaction.save()

  logger.info(`Crypto payment recorded: ${transaction._id}, tx: ${txHash}`)

  res.json({
    success: true,
    transactionId: transaction._id,
    status: 'pending',
    message: 'Payment recorded and pending verification'
  })
}))

// Get transaction status
router.get('/status/:id', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user._id
  })

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' })
  }

  res.json({
    transactionId: transaction._id,
    status: transaction.status,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    createdAt: transaction.createdAt,
    txHash: transaction.txHash,
    merchantName: transaction.merchantName
  })
}))

// Get user transactions
router.get('/history', authenticateToken, asyncHandler(async (req: any, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const transactions = await Transaction.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const total = await Transaction.countDocuments({ userId: req.user._id })

  res.json({
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}))

export default router
