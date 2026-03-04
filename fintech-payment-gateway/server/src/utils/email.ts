import axios from 'axios'
import nodemailer, { Transporter } from 'nodemailer'
import { config } from '../config/env'
import { logger } from './logger'

let cachedTransporter: Transporter | null = null
let smtpVerified: boolean | null = null

function isSmtpConfigured(): boolean {
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.smtpFrom)
}

function isResendConfigured(): boolean {
  return Boolean(config.resendApiKey && (config.resendFrom || config.smtpFrom))
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

  await transporter.sendMail({
    from: config.smtpFrom,
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

  const from = config.resendFrom || config.smtpFrom

  await axios.post(
    'https://api.resend.com/emails',
    {
      from,
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

export async function sendEmailVerificationOtp(email: string, firstName: string, otp: string): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const subject = 'Verify your FinPay account'
  const greetingName = firstName || 'there'
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto;">
      <h2 style="margin-bottom: 16px;">Email Verification</h2>
      <p style="font-size: 16px; line-height: 1.5;">Hi ${greetingName},</p>
      <p style="font-size: 16px; line-height: 1.5;">
        Use the verification code below to activate your FinPay account.
      </p>
      <div style="margin: 24px 0; padding: 16px; text-align: center; background: #e2e8f0; border-radius: 8px; letter-spacing: 6px; font-size: 30px; font-weight: 700;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #475569;">
        This code expires in ${config.emailOtpTtlMinutes} minutes. If you did not request this, you can ignore this email.
      </p>
    </div>
  `

  const text = `Hi ${greetingName}, your FinPay verification code is ${otp}. It expires in ${config.emailOtpTtlMinutes} minutes.`

  if (isSmtpConfigured()) {
    try {
      await sendUsingSmtp(recipient, subject, text, html)
      logger.info(`Verification OTP delivered via SMTP to ${maskEmail(recipient)}`)
      return
    } catch (error: any) {
      logger.error(`SMTP delivery failed for ${maskEmail(recipient)}: ${error.message}`)
    }
  }

  if (isResendConfigured()) {
    try {
      await sendUsingResend(recipient, subject, text, html)
      logger.info(`Verification OTP delivered via Resend to ${maskEmail(recipient)}`)
      return
    } catch (error: any) {
      logger.error(`Resend delivery failed for ${maskEmail(recipient)}: ${error.message}`)
      throw new Error('Email delivery failed across all configured providers.')
    }
  }

  if (config.isProduction) {
    throw new Error(
      'Email service not configured. Set SMTP_* variables or RESEND_API_KEY and RESEND_FROM.'
    )
  }

  // Development fallback so OTP flow can be tested without SMTP provider.
  logger.warn(`Email provider not configured. OTP for ${recipient}: ${otp}`)
}
