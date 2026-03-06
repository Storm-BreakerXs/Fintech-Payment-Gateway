import axios from 'axios'
import nodemailer, { Transporter } from 'nodemailer'
import { config } from '../config/env'
import { logger } from './logger'

type EmailProvider = 'smtp' | 'resend' | 'none'
type EmailTone = 'brand' | 'security' | 'success' | 'warning'

interface BrandedEmailCta {
  label: string
  url: string
}

interface BrandedEmailOptions {
  preheader: string
  eyebrow: string
  title: string
  subtitle?: string
  tone?: EmailTone
  bodyHtml: string
  cta?: BrandedEmailCta
  footerReason: string
}

interface DeliveryPayload {
  recipient: string
  subject: string
  text: string
  html: string
  context: string
  missingProviderLog?: string
}

interface EmailContent {
  subject: string
  text: string
  html: string
}

interface SalesInquiryPayload {
  fullName: string
  workEmail: string
  companyName: string
  role: string
  country: string
  monthlyVolume: string
  preferredContact: string
  message: string
  sourcePath?: string
  referrer?: string
  userAgent?: string
  ipAddress?: string
  submittedAt?: string
}

export type EmailPreviewTemplate =
  | 'verification'
  | 'welcome'
  | 'password-reset'
  | 'password-changed'
  | 'deletion-scheduled'
  | 'deletion-canceled'
  | 'sales-inquiry'
  | 'sales-ack'

export interface EmailTemplatePreview extends EmailContent {
  template: EmailPreviewTemplate
}

const EMAIL_PREVIEW_TEMPLATES: EmailPreviewTemplate[] = [
  'verification',
  'welcome',
  'password-reset',
  'password-changed',
  'deletion-scheduled',
  'deletion-canceled',
  'sales-inquiry',
  'sales-ack',
]

const FALLBACK_SUPPORT_EMAIL = 'support@finpay.com.ng'
const toneStyles: Record<EmailTone, {
  chipBg: string
  chipBorder: string
  chipText: string
  titleColor: string
  cardBorder: string
  ctaBg: string
  ctaText: string
}> = {
  brand: {
    chipBg: 'transparent',
    chipBorder: '#3b82f6',
    chipText: '#9fb8e5',
    titleColor: '#f1f5ff',
    cardBorder: '#243756',
    ctaBg: '#2e6ef7',
    ctaText: '#f8fbff',
  },
  security: {
    chipBg: 'transparent',
    chipBorder: '#3b82f6',
    chipText: '#9fb8e5',
    titleColor: '#f1f5ff',
    cardBorder: '#243756',
    ctaBg: '#2e6ef7',
    ctaText: '#f8fbff',
  },
  success: {
    chipBg: 'transparent',
    chipBorder: '#22c55e',
    chipText: '#99e2b5',
    titleColor: '#e8fff1',
    cardBorder: '#25583a',
    ctaBg: '#1f9f5c',
    ctaText: '#f8fffb',
  },
  warning: {
    chipBg: 'transparent',
    chipBorder: '#ef4444',
    chipText: '#f2b4b4',
    titleColor: '#ffe8e8',
    cardBorder: '#6a2b2b',
    ctaBg: '#d9473c',
    ctaText: '#fff9f7',
  },
}

let cachedTransporter: Transporter | null = null
let smtpVerified: boolean | null = null

function isSmtpConfigured(): boolean {
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPass)
}

function isResendConfigured(): boolean {
  return Boolean(config.resendApiKey && (config.resendFrom || config.smtpFrom || config.smtpUser))
}

function resolveSmtpFrom(): string {
  if (config.smtpFrom && config.smtpFrom.includes('@')) {
    return config.smtpFrom
  }
  return config.smtpUser
}

function extractEmailAddress(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const matched = trimmed.match(/<([^>]+)>/)
  const candidate = matched?.[1] || trimmed
  return candidate.replace(/^mailto:/i, '').trim()
}

function resolveSupportEmail(): string {
  const preferred = extractEmailAddress(config.smtpFrom || config.resendFrom || config.smtpUser)
  if (preferred && preferred.includes('@')) {
    return preferred
  }
  return FALLBACK_SUPPORT_EMAIL
}

function resolveFromHeader(displayName = 'FinPay Support'): string {
  const configured = config.smtpFrom || config.resendFrom || config.smtpUser

  if (configured && configured.includes('<') && configured.includes('>')) {
    return configured
  }

  const fromAddress = extractEmailAddress(configured || resolveSupportEmail())
  if (fromAddress && fromAddress.includes('@')) {
    return `${displayName} <${fromAddress}>`
  }

  return `${displayName} <${FALLBACK_SUPPORT_EMAIL}>`
}

function getTransporter(): Transporter | null {
  if (!isSmtpConfigured()) {
    return null
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  }

  return cachedTransporter
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!name || !domain) return email

  if (name.length <= 2) {
    return `${name[0] || '*'}*@${domain}`
  }

  return `${name[0]}${'*'.repeat(Math.max(name.length - 2, 1))}${name[name.length - 1]}@${domain}`
}

function isNetlifyClientUrl(value: string): boolean {
  const normalized = value.trim()
  if (!normalized) return false

  try {
    const hostname = new URL(normalized).hostname.toLowerCase()
    return hostname.endsWith('.netlify.app')
      || hostname === 'netlify.app'
      || hostname.endsWith('.netlify.com')
      || hostname === 'netlify.com'
  } catch {
    return /netlify/i.test(normalized)
  }
}

function getPrimaryClientUrl(): string {
  const candidates = config.clientUrl
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  const preferred = candidates.find((entry) => !isNetlifyClientUrl(entry))
  return preferred || 'http://localhost:5173'
}

function buildClientUrl(pathname: string): string {
  const base = getPrimaryClientUrl().replace(/\/+$/, '')
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${normalizedPath}`
}

function sanitizeUrl(url: string): string {
  const trimmed = String(url || '').trim()
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) {
    return trimmed
  }
  return '#'
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttribute(input: string): string {
  return escapeHtml(input).replace(/`/g, '&#96;')
}

function safeName(firstName?: string | null): string {
  const trimmed = String(firstName || '').trim()
  return trimmed || 'there'
}

function firstNameFromFullName(fullName?: string | null): string {
  const trimmed = String(fullName || '').trim()
  if (!trimmed) return 'there'
  return trimmed.split(/\s+/)[0] || 'there'
}

function formatUtcDateTime(date: Date): string {
  return date.toUTCString()
}

function formatIsoToUtcDisplay(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return formatUtcDateTime(parsed)
}

function renderLogoLockup(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
      <tr>
        <td style="width: 8px; background: linear-gradient(180deg, #3b82f6 0%, #2dd4bf 100%); border-radius: 8px;"></td>
        <td style="padding-left: 14px;">
          <p style="margin: 0; color: #f8fbff; font-size: 27px; font-weight: 650; line-height: 1.08; letter-spacing: -0.015em;">FinPay</p>
          <p style="margin: 4px 0 0; color: #9db0cc; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;">Payments Infrastructure</p>
        </td>
      </tr>
    </table>
  `
}

function renderBodyParagraph(value: string): string {
  return `<p style="margin: 0 0 15px; color: #d5dff0; font-size: 16px; line-height: 1.62;">${value}</p>`
}

function renderCodeBlock(code: string): string {
  return `
    <div style="margin: 24px 0; border-radius: 12px; border: 1px solid #2f4467; background: #0b1326; text-align: center; padding: 18px 14px;">
      <p style="margin: 0; font-size: 36px; line-height: 1; font-weight: 700; letter-spacing: 0.34em; color: #f0f5ff;">${escapeHtml(code)}</p>
    </div>
  `
}

function renderInfoTable(rows: Array<{ label: string; value: string }>): string {
  const renderedRows = rows
    .map((row) => `
      <tr>
        <td style="padding: 8px 0; color: #94a3b8; font-size: 13px; vertical-align: top; width: 40%;">${escapeHtml(row.label)}</td>
        <td style="padding: 8px 0; color: #e2e8f0; font-size: 13px; font-weight: 600; vertical-align: top;">${escapeHtml(row.value)}</td>
      </tr>
    `)
    .join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 16px 0;">
      ${renderedRows}
    </table>
  `
}

function renderBrandedEmail(options: BrandedEmailOptions): string {
  const tone = toneStyles[options.tone || 'brand']
  const preheader = escapeHtml(options.preheader)
  const eyebrow = escapeHtml(options.eyebrow)
  const title = escapeHtml(options.title)
  const subtitle = options.subtitle ? escapeHtml(options.subtitle) : ''

  const privacyUrl = escapeAttribute(buildClientUrl('/privacy-policy'))
  const contactSalesUrl = escapeAttribute(buildClientUrl('/contact-sales'))
  const supportEmail = escapeHtml(resolveSupportEmail())
  const supportEmailHref = escapeAttribute(`mailto:${resolveSupportEmail()}`)

  const ctaHtml = options.cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="border-radius: 10px; background: ${tone.ctaBg}; text-align: center;">
            <a href="${escapeAttribute(sanitizeUrl(options.cta.url))}" style="display: inline-block; padding: 13px 24px; font-size: 15px; line-height: 1.2; color: ${tone.ctaText}; font-weight: 650; text-decoration: none;">
              ${escapeHtml(options.cta.label)}
            </a>
          </td>
        </tr>
      </table>
    `
    : ''

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        <title>${title}</title>
        <style>
          body { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
          a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
          @media only screen and (max-width: 640px) {
            .fp-shell { padding: 16px 10px !important; }
            .fp-card { padding: 18px !important; }
            .fp-title { font-size: 36px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background: #070d1a; font-family: 'Avenir Next', 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; visibility: hidden; mso-hide: all;">${preheader}</div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; background: radial-gradient(circle at top, #11274a 0%, #070d1a 64%);">
          <tr>
            <td class="fp-shell" align="center" style="padding: 26px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; max-width: 680px;">
                <tr>
                  <td style="padding: 0 4px 16px;">
                    ${renderLogoLockup()}
                  </td>
                </tr>

                <tr>
                  <td style="border-radius: 18px; border: 1px solid ${tone.cardBorder}; overflow: hidden; background: #081329; box-shadow: 0 22px 42px rgba(3, 9, 22, 0.54);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding: 28px 28px 14px; background: linear-gradient(145deg, #0b1733 0%, #0b1324 100%); border-bottom: 1px solid #22344f;">
                          <span style="display: inline-block; padding: 0 0 0 10px; border-left: 2px solid ${tone.chipBorder}; background: ${tone.chipBg}; color: ${tone.chipText}; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; line-height: 1.3;">
                            ${eyebrow}
                          </span>
                          <h1 class="fp-title" style="margin: 14px 0 0; color: ${tone.titleColor}; font-size: 48px; line-height: 1.1; font-weight: 730; letter-spacing: -0.022em;">${title}</h1>
                          ${subtitle ? `<p style="margin: 12px 0 0; color: #9aafcc; font-size: 16px; line-height: 1.52;">${subtitle}</p>` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td class="fp-card" style="padding: 28px;">
                          ${options.bodyHtml}
                          ${ctaHtml}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 16px 8px 0;">
                    <p style="margin: 0 0 8px; color: #8ca2c1; font-size: 12px; line-height: 1.6;">
                      Need help? Contact <a href="${supportEmailHref}" style="color: #7bc4ff; text-decoration: underline;">${supportEmail}</a>
                    </p>
                    <p style="margin: 0 0 8px; color: #6d809d; font-size: 12px; line-height: 1.6;">
                      You are receiving this email because ${escapeHtml(options.footerReason)}
                    </p>
                    <p style="margin: 0; color: #6d809d; font-size: 12px; line-height: 1.6;">
                      <a href="${privacyUrl}" style="color: #7bc4ff; text-decoration: underline;">Privacy Policy</a>
                      &nbsp;•&nbsp;
                      <a href="${contactSalesUrl}" style="color: #7bc4ff; text-decoration: underline;">Contact Sales</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

async function verifySmtpTransport(transporter: Transporter): Promise<void> {
  if (smtpVerified !== null) {
    if (!smtpVerified) {
      throw new Error('SMTP verification previously failed.')
    }
    return
  }

  try {
    await transporter.verify()
    smtpVerified = true
    logger.info('SMTP transport verified successfully')
  } catch (error: any) {
    smtpVerified = false
    throw new Error(`SMTP verification failed: ${error.message}`)
  }
}

async function sendUsingSmtp(to: string, subject: string, text: string, html: string): Promise<void> {
  const transporter = getTransporter()
  if (!transporter) {
    throw new Error('SMTP is not configured.')
  }

  await verifySmtpTransport(transporter)

  const fromHeader = resolveFromHeader()

  await transporter.sendMail({
    from: fromHeader,
    sender: extractEmailAddress(fromHeader),
    replyTo: resolveSupportEmail(),
    to,
    subject,
    text,
    html,
  })
}

async function sendUsingResend(to: string, subject: string, text: string, html: string): Promise<void> {
  if (!isResendConfigured()) {
    throw new Error('Resend is not configured.')
  }

  const fromHeader = config.resendFrom || resolveFromHeader()

  await axios.post(
    'https://api.resend.com/emails',
    {
      from: fromHeader,
      to: [to],
      subject,
      text,
      html,
    },
    {
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  )
}

async function sendEmailWithConfiguredProvider(to: string, subject: string, text: string, html: string): Promise<EmailProvider> {
  let smtpFailureMessage = ''

  if (isSmtpConfigured()) {
    try {
      await sendUsingSmtp(to, subject, text, html)
      return 'smtp'
    } catch (error: any) {
      smtpFailureMessage = error.message || 'Unknown SMTP error.'
      logger.error(`SMTP delivery failed for ${maskEmail(to)}: ${smtpFailureMessage}`)
    }
  }

  if (isResendConfigured()) {
    try {
      await sendUsingResend(to, subject, text, html)
      return 'resend'
    } catch (error: any) {
      logger.error(`Resend delivery failed for ${maskEmail(to)}: ${error.message}`)
      throw new Error('Email delivery failed across all configured providers.')
    }
  }

  if (config.isProduction) {
    throw new Error(
      'Email service not configured. Set SMTP_* variables or RESEND_API_KEY and RESEND_FROM.'
    )
  }

  if (smtpFailureMessage) {
    throw new Error(`SMTP delivery failed: ${smtpFailureMessage}`)
  }

  return 'none'
}

async function deliverEmail(payload: DeliveryPayload): Promise<void> {
  const provider = await sendEmailWithConfiguredProvider(
    payload.recipient,
    payload.subject,
    payload.text,
    payload.html
  )

  if (provider === 'smtp') {
    logger.info(`${payload.context} delivered via SMTP (${resolveSmtpFrom()}) to ${maskEmail(payload.recipient)}`)
    return
  }

  if (provider === 'resend') {
    logger.info(`${payload.context} delivered via Resend to ${maskEmail(payload.recipient)}`)
    return
  }

  logger.warn(payload.missingProviderLog || `Email provider not configured. ${payload.context} skipped for ${payload.recipient}`)
}

function createEmailVerificationContent(firstName: string, otp: string): EmailContent {
  const greetingName = escapeHtml(safeName(firstName))
  const subject = 'FinPay verification code'

  const bodyHtml = [
    renderBodyParagraph(`Hi ${greetingName},`),
    renderBodyParagraph('Enter this one-time code in FinPay to confirm your email address and finish securing your account.'),
    renderCodeBlock(otp),
    renderBodyParagraph(`This code expires in ${config.emailOtpTtlMinutes} minutes and can only be used once.`),
    renderBodyParagraph('If you did not request this, you can safely ignore this email.'),
  ].join('')

  const html = renderBrandedEmail({
    preheader: `Your FinPay verification code is ${otp}.`,
    eyebrow: 'Account Verification',
    title: 'Confirm Your Email',
    subtitle: 'One secure step before account access.',
    tone: 'security',
    bodyHtml,
    footerReason: 'you started creating a FinPay account.',
  })

  const text = [
    `Hi ${safeName(firstName)},`,
    '',
    `Your FinPay verification code is: ${otp}`,
    `It expires in ${config.emailOtpTtlMinutes} minutes.`,
    '',
    'If you did not request this, ignore this email.',
  ].join('\n')

  return { subject, text, html }
}

function createWelcomeEmailContent(firstName: string): EmailContent {
  const greetingName = escapeHtml(safeName(firstName))
  const subject = 'Welcome to FinPay'
  const dashboardUrl = buildClientUrl('/dashboard')

  const bodyHtml = [
    renderBodyParagraph(`Hi ${greetingName},`),
    renderBodyParagraph('Your account is verified and active. You can now move money, monitor settlements, and manage operations from one control surface.'),
    '<div style="margin: 16px 0; padding: 16px; border-radius: 12px; border: 1px solid #334155; background: #0f172a;">',
    '<p style="margin: 0 0 10px; color: #f8fafc; font-size: 14px; font-weight: 700;">Recommended next steps</p>',
    '<p style="margin: 0 0 8px; color: #cbd5e1; font-size: 14px; line-height: 1.6;">1. Complete business profile and security controls.</p>',
    '<p style="margin: 0 0 8px; color: #cbd5e1; font-size: 14px; line-height: 1.6;">2. Connect settlement accounts and payout rails.</p>',
    '<p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">3. Launch local and cross-border transactions.</p>',
    '</div>',
    renderBodyParagraph('If you did not create this account, contact FinPay support immediately.'),
  ].join('')

  const html = renderBrandedEmail({
    preheader: 'Your FinPay account is active.',
    eyebrow: 'Account Activated',
    title: 'Your Account Is Live',
    subtitle: 'Your payment infrastructure is ready to use.',
    tone: 'brand',
    bodyHtml,
    cta: {
      label: 'Open Dashboard',
      url: dashboardUrl,
    },
    footerReason: 'your FinPay account was successfully verified.',
  })

  const text = [
    `Hi ${safeName(firstName)},`,
    '',
    'Welcome to FinPay. Your account is verified and active.',
    'Next steps:',
    '- Complete profile and security settings',
    '- Connect settlement accounts or wallet',
    '- Start processing transactions',
    '',
    `Dashboard: ${dashboardUrl}`,
    'If this was not you, contact support immediately.',
  ].join('\n')

  return { subject, text, html }
}

function createPasswordResetEmailContent(firstName: string, resetCode: string, resetLink: string): EmailContent {
  const greetingName = escapeHtml(safeName(firstName))
  const subject = 'Reset your FinPay password'
  const secureResetLink = sanitizeUrl(resetLink)

  const bodyHtml = [
    renderBodyParagraph(`Hi ${greetingName},`),
    renderBodyParagraph('We received a request to reset your FinPay password. Use this one-time code to continue.'),
    renderCodeBlock(resetCode),
    renderBodyParagraph(`This code expires in ${config.passwordResetTtlMinutes} minutes and can be used once.`),
    `<p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">If the button does not open, use this secure link: <a href="${escapeAttribute(secureResetLink)}" style="color: #67e8f9; text-decoration: underline;">Open secure reset link</a></p>`,
    '<p style="margin: 14px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">If you did not request this, ignore this message. Your password will remain unchanged.</p>',
  ].join('')

  const html = renderBrandedEmail({
    preheader: `Your FinPay reset code is ${resetCode}.`,
    eyebrow: 'Account Security',
    title: 'Reset Your Password',
    subtitle: 'Use your code or secure link to restore access.',
    tone: 'security',
    bodyHtml,
    cta: {
      label: 'Reset Password',
      url: secureResetLink,
    },
    footerReason: 'a password reset was requested for your FinPay account.',
  })

  const text = [
    `Hi ${safeName(firstName)},`,
    '',
    'We received a request to reset your FinPay password.',
    `Reset code: ${resetCode}`,
    `This code expires in ${config.passwordResetTtlMinutes} minutes.`,
    `Reset link: ${resetLink}`,
    '',
    'If you did not request this, ignore this email.',
  ].join('\n')

  return { subject, text, html }
}

function createPasswordChangedConfirmationEmailContent(firstName: string, changedAt: Date): EmailContent {
  const greetingName = escapeHtml(safeName(firstName))
  const changedAtUtc = formatUtcDateTime(changedAt)
  const subject = 'FinPay security alert: password changed'
  const loginUrl = buildClientUrl('/auth?mode=login')

  const bodyHtml = [
    renderBodyParagraph(`Hi ${greetingName},`),
    renderBodyParagraph('Your FinPay password was changed successfully. This confirmation is for your security.'),
    `<p style="margin: 0 0 14px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">Time (UTC): <strong style="color: #f8fafc;">${escapeHtml(changedAtUtc)}</strong></p>`,
    '<p style="margin: 0 0 14px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">If this was not you, sign in immediately, change your password, and contact support.</p>',
  ].join('')

  const html = renderBrandedEmail({
    preheader: 'Your FinPay password was changed.',
    eyebrow: 'Security Alert',
    title: 'Password Changed',
    subtitle: 'Review account security if this was not expected.',
    tone: 'success',
    bodyHtml,
    cta: {
      label: 'Review Account Security',
      url: loginUrl,
    },
    footerReason: 'a password update was completed on your FinPay account.',
  })

  const text = [
    `Hi ${safeName(firstName)},`,
    '',
    'Your FinPay password was changed successfully.',
    `Time (UTC): ${changedAtUtc}`,
    '',
    `Sign in: ${loginUrl}`,
    'If this was not you, contact support immediately.',
  ].join('\n')

  return { subject, text, html }
}

function createAccountDeletionScheduledEmailContent(firstName: string, scheduledFor: Date, cancelLink?: string): EmailContent {
  const greetingName = escapeHtml(safeName(firstName))
  const subject = 'FinPay deletion scheduled'
  const scheduledTime = formatUtcDateTime(scheduledFor)
  const signInUrl = sanitizeUrl(cancelLink || buildClientUrl('/auth?mode=login'))

  const bodyHtml = [
    renderBodyParagraph(`Hi ${greetingName},`),
    renderBodyParagraph('Your FinPay account has been queued for permanent deletion.'),
    `<p style="margin: 0 0 14px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">Grace window: <strong style="color: #f8fafc;">${config.accountDeletionGraceHours} hour(s)</strong></p>`,
    `<p style="margin: 0 0 14px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">Scheduled deletion time (UTC): <strong style="color: #f8fafc;">${escapeHtml(scheduledTime)}</strong></p>`,
    '<p style="margin: 0; color: #fca5a5; font-size: 15px; line-height: 1.6;">Sign in before the deadline to cancel automatically. If this was not you, act immediately.</p>',
  ].join('')

  const html = renderBrandedEmail({
    preheader: 'Your account deletion request is now scheduled.',
    eyebrow: 'Security Notice',
    title: 'Deletion Is Scheduled',
    subtitle: 'Sign in during the grace window to keep this account active.',
    tone: 'warning',
    bodyHtml,
    cta: {
      label: 'Sign In to Cancel Deletion',
      url: signInUrl,
    },
    footerReason: 'an account deletion request was initiated on FinPay.',
  })

  const text = [
    `Hi ${safeName(firstName)},`,
    '',
    'Your FinPay account is scheduled for permanent deletion.',
    `Grace window: ${config.accountDeletionGraceHours} hour(s)`,
    `Scheduled deletion time (UTC): ${scheduledTime}`,
    '',
    `Sign in to cancel: ${cancelLink || buildClientUrl('/auth?mode=login')}`,
  ].join('\n')

  return { subject, text, html }
}

function createAccountDeletionCanceledEmailContent(firstName: string, reason: 'login' | 'manual'): EmailContent {
  const greetingName = escapeHtml(safeName(firstName))
  const subject = 'FinPay deletion canceled'
  const securityUrl = buildClientUrl('/settings')
  const reasonText = reason === 'login'
    ? `because you signed in during the ${config.accountDeletionGraceHours}-hour grace period`
    : 'from your account settings'

  const bodyHtml = [
    renderBodyParagraph(`Hi ${greetingName},`),
    renderBodyParagraph(`Your account deletion request was canceled ${escapeHtml(reasonText)}.`),
    renderBodyParagraph('Your account remains active. If you did not authorize this action, reset your password immediately and contact support.'),
  ].join('')

  const html = renderBrandedEmail({
    preheader: 'Your FinPay deletion request was canceled.',
    eyebrow: 'Security Notice',
    title: 'Deletion Request Canceled',
    subtitle: 'Your account is active and remains protected.',
    tone: 'success',
    bodyHtml,
    cta: {
      label: 'Review Security Settings',
      url: securityUrl,
    },
    footerReason: 'a deletion request on your FinPay account was canceled.',
  })

  const text = [
    `Hi ${safeName(firstName)},`,
    '',
    `Your FinPay account deletion request was canceled ${reasonText}.`,
    `Review settings: ${securityUrl}`,
    'If this was not you, reset your password and contact support immediately.',
  ].join('\n')

  return { subject, text, html }
}

function createSalesInquiryEmailContent(payload: SalesInquiryPayload): EmailContent {
  const submittedAt = payload.submittedAt || new Date().toISOString()
  const submittedAtDisplay = formatIsoToUtcDisplay(submittedAt)
  const subject = `New FinPay lead: ${payload.companyName}`

  const bodyHtml = [
    renderBodyParagraph('A new enterprise sales request was submitted on FinPay.'),
    renderInfoTable([
      { label: 'Name', value: payload.fullName },
      { label: 'Work Email', value: payload.workEmail },
      { label: 'Company', value: payload.companyName },
      { label: 'Role', value: payload.role },
      { label: 'Country', value: payload.country },
      { label: 'Monthly Volume', value: payload.monthlyVolume },
      { label: 'Preferred Contact', value: payload.preferredContact },
      { label: 'Submitted At (UTC)', value: submittedAtDisplay },
    ]),
    '<div style="margin-top: 10px; padding: 14px; border-radius: 12px; border: 1px solid #334155; background: #0f172a;">',
    '<p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">Lead Message</p>',
    `<p style="margin: 0; color: #e2e8f0; font-size: 14px; line-height: 1.6;">${escapeHtml(payload.message).replace(/\n/g, '<br />')}</p>`,
    '</div>',
    renderInfoTable([
      { label: 'Source Path', value: payload.sourcePath || '/contact-sales' },
      { label: 'Referrer', value: payload.referrer || 'N/A' },
      { label: 'IP Address', value: payload.ipAddress || 'N/A' },
    ]),
  ].join('')

  const html = renderBrandedEmail({
    preheader: `New sales lead from ${payload.companyName}.`,
    eyebrow: 'Sales Lead',
    title: 'New Enterprise Lead',
    subtitle: 'Review qualification details and assign owner.',
    tone: 'brand',
    bodyHtml,
    footerReason: 'a visitor submitted the FinPay contact sales form.',
  })

  const text = [
    'New Contact Sales Request',
    `Name: ${payload.fullName}`,
    `Work Email: ${payload.workEmail}`,
    `Company: ${payload.companyName}`,
    `Role: ${payload.role}`,
    `Country: ${payload.country}`,
    `Monthly Volume: ${payload.monthlyVolume}`,
    `Preferred Contact: ${payload.preferredContact}`,
    `Submitted At (UTC): ${submittedAtDisplay}`,
    `Source Path: ${payload.sourcePath || '/contact-sales'}`,
    `Referrer: ${payload.referrer || 'N/A'}`,
    `IP Address: ${payload.ipAddress || 'N/A'}`,
    `User Agent: ${payload.userAgent || 'N/A'}`,
    '',
    'Message:',
    payload.message,
  ].join('\n')

  return { subject, text, html }
}

function createSalesInquiryAcknowledgementEmailContent(payload: SalesInquiryPayload): EmailContent {
  const greetingName = escapeHtml(firstNameFromFullName(payload.fullName))
  const subject = 'FinPay sales request received'
  const solutionsUrl = buildClientUrl('/solutions')

  const bodyHtml = [
    renderBodyParagraph(`Hi ${greetingName},`),
    renderBodyParagraph('Thanks for reaching out to FinPay. Your request was received and is now with our sales team.'),
    renderInfoTable([
      { label: 'Company', value: payload.companyName },
      { label: 'Role', value: payload.role },
      { label: 'Country', value: payload.country },
      { label: 'Monthly Volume', value: payload.monthlyVolume },
      { label: 'Preferred Contact', value: payload.preferredContact },
    ]),
    '<p style="margin: 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">A FinPay specialist will follow up within one business day. You can reply here with additional requirements anytime.</p>',
  ].join('')

  const html = renderBrandedEmail({
    preheader: 'Your FinPay sales request has been received.',
    eyebrow: 'Sales Confirmation',
    title: 'Request Confirmed',
    subtitle: 'A FinPay specialist will follow up within one business day.',
    tone: 'brand',
    bodyHtml,
    cta: {
      label: 'Explore FinPay Solutions',
      url: solutionsUrl,
    },
    footerReason: 'you submitted a contact-sales request to FinPay.',
  })

  const text = [
    `Hi ${firstNameFromFullName(payload.fullName)},`,
    '',
    'Thanks for contacting FinPay sales. Your request has been received.',
    'A specialist will follow up within one business day.',
    '',
    `Company: ${payload.companyName}`,
    `Role: ${payload.role}`,
    `Country: ${payload.country}`,
    `Monthly Volume: ${payload.monthlyVolume}`,
    `Preferred Contact: ${payload.preferredContact}`,
    '',
    `Explore solutions: ${solutionsUrl}`,
  ].join('\n')

  return { subject, text, html }
}

export async function sendEmailVerificationOtp(email: string, firstName: string, otp: string): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const content = createEmailVerificationContent(firstName, otp)

  await deliverEmail({
    recipient,
    subject: content.subject,
    text: content.text,
    html: content.html,
    context: 'Verification OTP email',
    missingProviderLog: `Email provider not configured. OTP for ${recipient}: ${otp}`,
  })
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const content = createWelcomeEmailContent(firstName)

  await deliverEmail({
    recipient,
    subject: content.subject,
    text: content.text,
    html: content.html,
    context: 'Welcome email',
  })
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetCode: string,
  resetLink: string
): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const content = createPasswordResetEmailContent(firstName, resetCode, resetLink)

  await deliverEmail({
    recipient,
    subject: content.subject,
    text: content.text,
    html: content.html,
    context: 'Password reset email',
  })
}

export async function sendPasswordChangedConfirmationEmail(
  email: string,
  firstName: string,
  changedAt: Date
): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const content = createPasswordChangedConfirmationEmailContent(firstName, changedAt)

  await deliverEmail({
    recipient,
    subject: content.subject,
    text: content.text,
    html: content.html,
    context: 'Password-changed confirmation email',
  })
}

export async function sendAccountDeletionScheduledEmail(
  email: string,
  firstName: string,
  scheduledFor: Date,
  cancelLink?: string
): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const content = createAccountDeletionScheduledEmailContent(firstName, scheduledFor, cancelLink)

  await deliverEmail({
    recipient,
    subject: content.subject,
    text: content.text,
    html: content.html,
    context: 'Deletion-scheduled email',
  })
}

export async function sendAccountDeletionCanceledEmail(
  email: string,
  firstName: string,
  reason: 'login' | 'manual'
): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const content = createAccountDeletionCanceledEmailContent(firstName, reason)

  await deliverEmail({
    recipient,
    subject: content.subject,
    text: content.text,
    html: content.html,
    context: 'Deletion-canceled email',
  })
}

export async function sendSalesInquiryEmail(payload: SalesInquiryPayload): Promise<void> {
  const destination = extractEmailAddress(config.salesInbox || resolveSupportEmail()) || FALLBACK_SUPPORT_EMAIL
  const content = createSalesInquiryEmailContent(payload)

  await deliverEmail({
    recipient: destination,
    subject: content.subject,
    text: content.text,
    html: content.html,
    context: 'Sales inquiry email',
    missingProviderLog: `Email provider not configured. Sales inquiry content logged for ${destination}: ${content.text}`,
  })
}

export async function sendSalesInquiryAcknowledgementEmail(payload: SalesInquiryPayload): Promise<void> {
  const recipient = payload.workEmail.trim().toLowerCase()
  const content = createSalesInquiryAcknowledgementEmailContent(payload)

  await deliverEmail({
    recipient,
    subject: content.subject,
    text: content.text,
    html: content.html,
    context: 'Sales inquiry acknowledgement email',
  })
}

export function listEmailPreviewTemplates(): EmailPreviewTemplate[] {
  return [...EMAIL_PREVIEW_TEMPLATES]
}

function createPreviewSalesPayload(): SalesInquiryPayload {
  return {
    fullName: 'Alex Morgan',
    workEmail: 'alex.morgan@northstarpay.com',
    companyName: 'Northstar Pay',
    role: 'Head of Treasury',
    country: 'United States',
    monthlyVolume: '$1M - $5M',
    preferredContact: 'Email',
    message: 'We need stablecoin payouts, card acquiring, and treasury APIs for multi-region settlements.',
    sourcePath: '/contact-sales',
    referrer: 'https://finpay.com.ng/solutions',
    userAgent: 'Mozilla/5.0',
    ipAddress: '127.0.0.1',
    submittedAt: '2026-03-06T10:30:00.000Z',
  }
}

export function buildEmailTemplatePreview(template: EmailPreviewTemplate): EmailTemplatePreview {
  const previewNow = new Date('2026-03-06T10:30:00.000Z')
  const scheduledFor = new Date(previewNow.getTime() + config.accountDeletionGraceHours * 60 * 60 * 1000)
  const resetLink = `${buildClientUrl('/auth')}?mode=reset&email=alex.morgan%40northstarpay.com&code=448271`
  const salesPayload = createPreviewSalesPayload()

  switch (template) {
    case 'verification':
      return {
        template,
        ...createEmailVerificationContent('Alex', '728194'),
      }
    case 'welcome':
      return {
        template,
        ...createWelcomeEmailContent('Alex'),
      }
    case 'password-reset':
      return {
        template,
        ...createPasswordResetEmailContent('Alex', '448271', resetLink),
      }
    case 'password-changed':
      return {
        template,
        ...createPasswordChangedConfirmationEmailContent('Alex', previewNow),
      }
    case 'deletion-scheduled':
      return {
        template,
        ...createAccountDeletionScheduledEmailContent('Alex', scheduledFor, buildClientUrl('/auth?mode=login')),
      }
    case 'deletion-canceled':
      return {
        template,
        ...createAccountDeletionCanceledEmailContent('Alex', 'login'),
      }
    case 'sales-inquiry':
      return {
        template,
        ...createSalesInquiryEmailContent(salesPayload),
      }
    case 'sales-ack':
      return {
        template,
        ...createSalesInquiryAcknowledgementEmailContent(salesPayload),
      }
    default: {
      const neverTemplate: never = template
      throw new Error(`Unsupported template preview: ${neverTemplate}`)
    }
  }
}
