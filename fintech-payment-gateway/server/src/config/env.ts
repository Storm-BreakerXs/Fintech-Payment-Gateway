import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

function loadEnvFiles() {
  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ]

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath })
    }
  }
}

loadEnvFiles()

type NodeEnv = 'development' | 'test' | 'production'

function getNodeEnv(value: string | undefined): NodeEnv {
  const resolved = value || 'development'
  if (resolved === 'development' || resolved === 'test' || resolved === 'production') {
    return resolved
  }
  throw new Error(`Invalid NODE_ENV "${resolved}". Use development, test, or production.`)
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getPort(value: string | undefined): number {
  const parsed = Number(value || '3001')
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid PORT "${value}". Expected an integer between 1 and 65535.`)
  }
  return parsed
}

const nodeEnv = getNodeEnv(process.env.NODE_ENV)
const isProduction = nodeEnv === 'production'

const jwtSecret = requireEnv('JWT_SECRET')
const encryptionKey = requireEnv('ENCRYPTION_KEY')

if (encryptionKey.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters.')
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim() || ''
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || ''

if (isProduction && (!stripeSecretKey || !stripeWebhookSecret)) {
  throw new Error('STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required in production.')
}

export const config = {
  nodeEnv,
  isProduction,
  port: getPort(process.env.PORT),
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').trim(),
  mongodbUri: requireEnv('MONGODB_URI'),
  redisUrl: requireEnv('REDIS_URL'),
  jwtSecret,
  encryptionKey,
  stripeSecretKey,
  stripeWebhookSecret,
}
