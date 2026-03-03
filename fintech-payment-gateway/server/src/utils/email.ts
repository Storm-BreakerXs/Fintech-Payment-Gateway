import nodemailer, { Transporter } from 'nodemailer'
import { config } from '../config/env'
import { logger } from './logger'

let cachedTransporter: Transporter | null = null

function isSmtpConfigured(): boolean {
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPass && config.smtpFrom)
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

export async function sendEmailVerificationOtp(email: string, firstName: string, otp: string): Promise<void> {
  const transporter = getTransporter()

  if (!transporter) {
    if (config.isProduction) {
      throw new Error('Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM.')
    }

    // Development fallback so OTP flow can be tested without SMTP.
    logger.warn(`SMTP not configured. OTP for ${email}: ${otp}`)
    return
  }

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

  await transporter.sendMail({
    from: config.smtpFrom,
    to: email,
    subject,
    text,
    html,
  })
}
