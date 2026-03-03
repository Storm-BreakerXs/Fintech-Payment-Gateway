import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

import { config } from './config/env'
import { connectDatabase } from './utils/database'
import { connectRedis } from './utils/redis'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'

import authRoutes from './routes/auth'
import paymentRoutes from './routes/payments'
import cryptoRoutes from './routes/crypto'
import webhookRoutes from './routes/webhooks'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })
const allowedOrigins = config.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function isDynamicAllowedOrigin(origin: string): boolean {
  return /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin)
    || /^http:\/\/localhost:\d+$/i.test(origin)
}

// Security middleware
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isDynamicAllowedOrigin(origin)) {
      return callback(null, true)
    }
    logger.warn(`Blocked CORS origin: ${origin}`)
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
app.use('/api/payments', paymentRoutes)
app.use('/api/crypto', cryptoRoutes)
app.use('/webhooks', webhookRoutes)

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
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})
