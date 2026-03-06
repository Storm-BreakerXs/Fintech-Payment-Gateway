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

function getUnitIntervalNumber(value: string | undefined, fallback: number, name: string): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`Invalid ${name} "${value}". Expected a number between 0 and 1.`)
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

function parseEmailList(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    )
  )
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
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY?.trim() || ''
const recaptchaEnabled = (process.env.RECAPTCHA_ENABLED?.trim() || (recaptchaSecretKey ? 'true' : 'false')).toLowerCase() === 'true'
const recaptchaMinScore = getUnitIntervalNumber(process.env.RECAPTCHA_MIN_SCORE?.trim(), 0.5, 'RECAPTCHA_MIN_SCORE')
const smtpHost = process.env.SMTP_HOST?.trim() || ''
const smtpPort = getOptionalPort(process.env.SMTP_PORT?.trim(), 587)
const smtpSecure = (process.env.SMTP_SECURE?.trim() || 'false').toLowerCase() === 'true'
const smtpUser = process.env.SMTP_USER?.trim() || ''
const smtpPass = normalizeSecret(process.env.SMTP_PASS)
const smtpFrom = normalizeSender(process.env.SMTP_FROM)
const adminEmails = parseEmailList(process.env.ADMIN_EMAILS)
const emailOtpTtlMinutes = getPositiveInt(process.env.EMAIL_OTP_TTL_MINUTES?.trim(), 10, 'EMAIL_OTP_TTL_MINUTES')
const otpResendCooldownSeconds = getPositiveInt(
  process.env.OTP_RESEND_COOLDOWN_SECONDS?.trim(),
  60,
  'OTP_RESEND_COOLDOWN_SECONDS'
)
const resendApiKey = process.env.RESEND_API_KEY?.trim() || ''
const resendFrom = normalizeSender(process.env.RESEND_FROM)
const salesInbox = normalizeSender(process.env.SALES_INBOX)
const crmWebhookUrl = process.env.CRM_WEBHOOK_URL?.trim() || ''
const crmWebhookAuthHeader = process.env.CRM_WEBHOOK_AUTH_HEADER?.trim() || ''
const crmWebhookAuthToken = process.env.CRM_WEBHOOK_AUTH_TOKEN?.trim() || ''
const crmWebhookSecret = process.env.CRM_WEBHOOK_SECRET?.trim() || ''
const crmLeadSourceLabel = process.env.CRM_LEAD_SOURCE_LABEL?.trim() || 'FinPay Contact Sales Form'
const hubspotPortalId = process.env.HUBSPOT_PORTAL_ID?.trim() || ''
const hubspotFormId = process.env.HUBSPOT_FORM_ID?.trim() || ''
const hubspotPrivateAppToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN?.trim() || ''
const hubspotFieldMonthlyVolume = process.env.HUBSPOT_FIELD_MONTHLY_VOLUME?.trim() || ''
const hubspotFieldPreferredContact = process.env.HUBSPOT_FIELD_PREFERRED_CONTACT?.trim() || ''
const hubspotFieldLeadSource = process.env.HUBSPOT_FIELD_LEAD_SOURCE?.trim() || ''
const salesforceLeadWebhookUrl = process.env.SALESFORCE_LEAD_WEBHOOK_URL?.trim() || ''
const salesforceApiToken = process.env.SALESFORCE_API_TOKEN?.trim() || ''
const salesforceFieldMonthlyVolume = process.env.SALESFORCE_FIELD_MONTHLY_VOLUME?.trim() || ''
const salesforceFieldPreferredContact = process.env.SALESFORCE_FIELD_PREFERRED_CONTACT?.trim() || ''
const passwordResetTtlMinutes = getPositiveInt(
  process.env.PASSWORD_RESET_TTL_MINUTES?.trim(),
  30,
  'PASSWORD_RESET_TTL_MINUTES'
)
const accountDeletionGraceHours = getPositiveInt(
  process.env.ACCOUNT_DELETION_GRACE_HOURS?.trim(),
  24,
  'ACCOUNT_DELETION_GRACE_HOURS'
)
const kycApiUrl = process.env.KYC_API_URL?.trim() || ''
const kycApiKey = process.env.KYC_API_KEY?.trim() || ''
const swapProviderBaseUrl = process.env.SWAP_PROVIDER_BASE_URL?.trim() || 'https://api.0x.org'
const swapProviderApiKey = process.env.SWAP_PROVIDER_API_KEY?.trim() || ''

if (isProduction && (!stripeSecretKey || !stripeWebhookSecret)) {
  throw new Error('STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required in production.')
}

if (isProduction && !redisUrl) {
  throw new Error('REDIS_URL is required in production.')
}

if (recaptchaEnabled && !recaptchaSecretKey) {
  throw new Error('RECAPTCHA_SECRET_KEY is required when RECAPTCHA_ENABLED=true.')
}

export const config = {
  nodeEnv,
  isProduction,
  port: getPort(process.env.PORT),
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').trim(),
  mongodbUri: requireEnv('MONGODB_URI'),
  redisUrl,
  recaptchaEnabled,
  recaptchaSecretKey,
  recaptchaMinScore,
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
  adminEmails,
  emailOtpTtlMinutes,
  otpResendCooldownSeconds,
  resendApiKey,
  resendFrom,
  salesInbox,
  crmWebhookUrl,
  crmWebhookAuthHeader,
  crmWebhookAuthToken,
  crmWebhookSecret,
  crmLeadSourceLabel,
  hubspotPortalId,
  hubspotFormId,
  hubspotPrivateAppToken,
  hubspotFieldMonthlyVolume,
  hubspotFieldPreferredContact,
  hubspotFieldLeadSource,
  salesforceLeadWebhookUrl,
  salesforceApiToken,
  salesforceFieldMonthlyVolume,
  salesforceFieldPreferredContact,
  passwordResetTtlMinutes,
  accountDeletionGraceHours,
  kycApiUrl,
  kycApiKey,
  swapProviderBaseUrl,
  swapProviderApiKey,
}
