import express from 'express'
import Stripe from 'stripe'
import { config } from '../config/env'
import { Transaction } from '../utils/database'
import { logger } from '../utils/logger'

const router = express.Router()
const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, { apiVersion: '2023-10-16' })
  : null

// Stripe webhook handler
router.post('/stripe', async (req, res) => {
  if (!stripe || !config.stripeWebhookSecret) {
    return res.status(503).json({
      error: 'Stripe webhooks are not configured',
      message: 'Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET on the server'
    })
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).send('Webhook Error: expected raw request body')
  }

  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret)
  } catch (err: any) {
    logger.error('Stripe webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  logger.info(`Stripe webhook received: ${event.type}`)

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Update transaction status
      await Transaction.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { 
          status: 'completed',
          'metadata.chargeId': paymentIntent.latest_charge,
          updatedAt: new Date()
        }
      )

      logger.info(`Payment succeeded: ${paymentIntent.id}`)
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent

      await Transaction.findOneAndUpdate(
        { stripePaymentIntentId: failedPayment.id },
        { 
          status: 'failed',
          'metadata.failureMessage': failedPayment.last_payment_error?.message,
          updatedAt: new Date()
        }
      )

      logger.info(`Payment failed: ${failedPayment.id}`)
      break

    case 'charge.refunded':
      const charge = event.data.object as Stripe.Charge

      await Transaction.findOneAndUpdate(
        { 'metadata.chargeId': charge.id },
        { 
          status: 'refunded',
          'metadata.refundAmount': charge.amount_refunded,
          updatedAt: new Date()
        }
      )

      logger.info(`Charge refunded: ${charge.id}`)
      break

    default:
      logger.info(`Unhandled event type: ${event.type}`)
  }

  res.json({ received: true })
})

// Crypto payment verification webhook (for blocknative, alchemy, etc.)
router.post('/crypto', async (req, res) => {
  const { txHash, status, confirmations } = req.body

  try {
    // Find transaction by txHash
    const transaction = await Transaction.findOne({ txHash })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Update status based on confirmations
    if (status === 'confirmed' && confirmations >= 12) {
      transaction.status = 'completed'
      transaction.metadata = {
        ...transaction.metadata,
        confirmations,
        confirmedAt: new Date()
      }
    } else if (status === 'failed') {
      transaction.status = 'failed'
    }

    await transaction.save()

    logger.info(`Crypto transaction ${txHash} updated: ${transaction.status}`)

    res.json({ success: true })
  } catch (error) {
    logger.error('Crypto webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
