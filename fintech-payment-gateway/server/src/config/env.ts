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

function getOptionalPort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid port "${value}". Expected an integer between 1 and 65535.`)
  }
  return parsed
}

function getPositiveInt(value: string | undefined, fallback: number, name: string): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} "${value}". Expected a positive integer.`)
  }
  return parsed
}

function normalizeSecret(value: string | undefined): string {
  return (value || '').replace(/\s+/g, '').trim()
}

function normalizeSender(value: string | undefined): string {
  const trimmed = (value || '').trim()
  return trimmed
    .replace(/^"(.*)"$/, '$1')
    .replace(/^'(.*)'$/, '$1')
    .trim()
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
const redisUrl = process.env.REDIS_URL?.trim() || ''
const smtpHost = process.env.SMTP_HOST?.trim() || ''
const smtpPort = getOptionalPort(process.env.SMTP_PORT?.trim(), 587)
const smtpSecure = (process.env.SMTP_SECURE?.trim() || 'false').toLowerCase() === 'true'
const smtpUser = process.env.SMTP_USER?.trim() || ''
const smtpPass = normalizeSecret(process.env.SMTP_PASS)
const smtpFrom = normalizeSender(process.env.SMTP_FROM)
const emailOtpTtlMinutes = getPositiveInt(process.env.EMAIL_OTP_TTL_MINUTES?.trim(), 10, 'EMAIL_OTP_TTL_MINUTES')
const otpResendCooldownSeconds = getPositiveInt(
  process.env.OTP_RESEND_COOLDOWN_SECONDS?.trim(),
  60,
  'OTP_RESEND_COOLDOWN_SECONDS'
)
const resendApiKey = process.env.RESEND_API_KEY?.trim() || ''
const resendFrom = normalizeSender(process.env.RESEND_FROM)

if (isProduction && (!stripeSecretKey || !stripeWebhookSecret)) {
  throw new Error('STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required in production.')
}

if (isProduction && !redisUrl) {
  throw new Error('REDIS_URL is required in production.')
}

export const config = {
  nodeEnv,
  isProduction,
  port: getPort(process.env.PORT),
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').trim(),
  mongodbUri: requireEnv('MONGODB_URI'),
  redisUrl,
  jwtSecret,
  encryptionKey,
  stripeSecretKey,
  stripeWebhookSecret,
  smtpHost,
  smtpPort,
  smtpSecure,
  smtpUser,
  smtpPass,
  smtpFrom,
  emailOtpTtlMinutes,
  otpResendCooldownSeconds,
  resendApiKey,
  resendFrom,
}
