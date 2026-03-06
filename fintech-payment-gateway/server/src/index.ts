import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

import { config } from './config/env'
import { connectDatabase } from './utils/database'
import { connectRedis } from './utils/redis'
import { logger } from './utils/logger'
import { purgeDueAccountDeletions } from './utils/accountCleanup'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'

import authRoutes from './routes/auth'
import paymentRoutes from './routes/payments'
import cryptoRoutes from './routes/crypto'
import webhookRoutes from './routes/webhooks'
import userRoutes from './routes/users'
import adminRoutes from './routes/admin'
import devRoutes from './routes/dev'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })
let accountCleanupTimer: NodeJS.Timeout | null = null
const allowedOrigins = config.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .map((origin) => origin.replace(/\/$/, ''))
  .filter(Boolean)

logger.info(`Configured CORS origins: ${allowedOrigins.join(', ') || '(none)'}`)
logger.info(
  `Email providers: SMTP=${Boolean(config.smtpHost && config.smtpUser && config.smtpPass)} ` +
  `(host=${config.smtpHost || 'unset'}, user=${config.smtpUser || 'unset'}, from=${config.smtpFrom || 'unset'}), ` +
  `Resend=${Boolean(config.resendApiKey)}`
)

function isDynamicAllowedOrigin(origin: string): boolean {
  return /^http:\/\/localhost:\d+$/i.test(origin)
    || /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin)
    || /^https:\/\/(?:[a-z0-9-]+\.)?finpay\.com\.ng$/i.test(origin)
    || /^https:\/\/(?:[a-z0-9-]+\.)?finpay\.sbs$/i.test(origin)
}

// Security middleware
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = origin?.replace(/\/$/, '')
    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin) || isDynamicAllowedOrigin(normalizedOrigin)) {
      return callback(null, true)
    }
    logger.warn(`Blocked CORS origin: ${normalizedOrigin}`)
    return callback(null, false)
  },
  credentials: true
}))

// Rate limiting
app.use(rateLimiter)

// Stripe webhook signature verification requires raw request body.
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'fintech-payment-gateway',
    status: 'ok',
    docs: '/health',
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/crypto', cryptoRoutes)
app.use('/webhooks', webhookRoutes)

if (!config.isProduction) {
  app.use('/api/dev', devRoutes)
  logger.info('Development preview routes enabled at /api/dev')
}

// WebSocket handling
wss.on('connection', (ws) => {
  logger.info('New WebSocket connection')

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      // Handle different message types
      if (data.type === 'subscribe' && data.channel === 'prices') {
        ws.send(JSON.stringify({ type: 'subscribed', channel: 'prices' }))
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
    }
  })

  ws.on('close', () => {
    logger.info('WebSocket connection closed')
  })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase()

    // Connect to Redis
    await connectRedis()

    // Initial account cleanup run and recurring sweep.
    const deleted = await purgeDueAccountDeletions()
    if (deleted > 0) {
      logger.warn(`Startup cleanup removed ${deleted} scheduled account(s).`)
    }
    accountCleanupTimer = setInterval(async () => {
      try {
        const removed = await purgeDueAccountDeletions()
        if (removed > 0) {
          logger.warn(`Scheduled cleanup removed ${removed} account(s).`)
        }
      } catch (error) {
        logger.error('Scheduled account cleanup failed:', error)
      }
    }, 5 * 60 * 1000)

    // Start HTTP server
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`)
      logger.info(`Environment: ${config.nodeEnv}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  if (accountCleanupTimer) {
    clearInterval(accountCleanupTimer)
    accountCleanupTimer = null
  }
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})
