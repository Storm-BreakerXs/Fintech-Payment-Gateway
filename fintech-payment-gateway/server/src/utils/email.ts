import axios from 'axios'
import nodemailer, { Transporter } from 'nodemailer'
import { config } from '../config/env'
import { logger } from './logger'

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

  const from = resolveSmtpFrom()

  await transporter.sendMail({
    from,
    sender: config.smtpUser,
    replyTo: config.smtpUser,
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

  const from = config.resendFrom || resolveSmtpFrom()

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

async function sendEmailWithConfiguredProvider(to: string, subject: string, text: string, html: string): Promise<'smtp' | 'resend' | 'none'> {
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
  const provider = await sendEmailWithConfiguredProvider(recipient, subject, text, html)

  if (provider === 'smtp') {
    logger.info(`Verification OTP delivered via SMTP (${resolveSmtpFrom()}) to ${maskEmail(recipient)}`)
    return
  }

  if (provider === 'resend') {
    logger.info(`Verification OTP delivered via Resend to ${maskEmail(recipient)}`)
    return
  }

  logger.warn(`Email provider not configured. OTP for ${recipient}: ${otp}`)
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const greetingName = firstName || 'there'
  const subject = 'Welcome to FinPay'
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 620px; margin: 0 auto; background: #f8fafc; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0ea5e9 100%); color: #ffffff;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.85;">FinPay Private Client Platform</p>
        <h1 style="margin: 10px 0 0; font-size: 30px; line-height: 1.2;">Welcome aboard, ${greetingName}.</h1>
      </div>
      <div style="padding: 28px 32px;">
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 14px;">
          Your account is now verified and fully activated. You now have access to FinPay's enterprise-grade payment rails, real-time settlement visibility, and institutional-level security controls.
        </p>
        <div style="margin: 20px 0; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px 18px;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #334155;"><strong>What to do next</strong></p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">
            1) Complete profile and security settings<br />
            2) Connect your payment method or wallet<br />
            3) Start processing local and global transactions
          </p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
          If you did not authorize this activity, contact our security desk immediately at support@finpay.com.ng.
        </p>
      </div>
    </div>
  `

  const text = `Welcome to FinPay, ${greetingName}. Your account is now verified and active. You can now complete your profile, connect payment methods, and start processing transactions. If this was not you, contact support@finpay.com.ng immediately.`
  const provider = await sendEmailWithConfiguredProvider(recipient, subject, text, html)

  if (provider === 'smtp') {
    logger.info(`Welcome email delivered via SMTP (${resolveSmtpFrom()}) to ${maskEmail(recipient)}`)
    return
  }

  if (provider === 'resend') {
    logger.info(`Welcome email delivered via Resend to ${maskEmail(recipient)}`)
    return
  }

  logger.warn(`Email provider not configured. Welcome email skipped for ${recipient}`)
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetCode: string,
  resetLink: string
): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const greetingName = firstName || 'there'
  const subject = 'Reset your FinPay password'
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 620px; margin: 0 auto; background: #f8fafc; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="padding: 24px 30px; background: #0f172a; color: #ffffff;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85;">FinPay Account Security</p>
        <h2 style="margin: 10px 0 0; font-size: 27px;">Password Reset Request</h2>
      </div>
      <div style="padding: 28px 30px;">
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 14px;">Hi ${greetingName},</p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 14px;">
          We received a request to reset your FinPay password. Use the code below to complete the reset.
        </p>
        <div style="margin: 22px 0; padding: 16px; text-align: center; background: #e2e8f0; border-radius: 8px; letter-spacing: 5px; font-size: 28px; font-weight: 700;">
          ${resetCode}
        </div>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 14px; color: #334155;">
          Or open this secure link: <a href="${resetLink}" style="color: #0ea5e9;">Reset Password</a>
        </p>
        <p style="font-size: 13px; color: #64748b; margin: 0;">
          This code expires in ${config.passwordResetTtlMinutes} minutes. If you did not request this, ignore this email and keep your password unchanged.
        </p>
      </div>
    </div>
  `
  const text = `Hi ${greetingName}, your FinPay password reset code is ${resetCode}. It expires in ${config.passwordResetTtlMinutes} minutes. Reset link: ${resetLink}`
  const provider = await sendEmailWithConfiguredProvider(recipient, subject, text, html)

  if (provider === 'smtp') {
    logger.info(`Password reset email delivered via SMTP (${resolveSmtpFrom()}) to ${maskEmail(recipient)}`)
    return
  }

  if (provider === 'resend') {
    logger.info(`Password reset email delivered via Resend to ${maskEmail(recipient)}`)
    return
  }

  logger.warn(`Email provider not configured. Password reset email skipped for ${recipient}`)
}

export async function sendAccountDeletionScheduledEmail(
  email: string,
  firstName: string,
  scheduledFor: Date,
  cancelLink?: string
): Promise<void> {
  const recipient = email.trim().toLowerCase()
  const greetingName = firstName || 'there'
  const subject = 'FinPay account deletion scheduled'
  const scheduledTime = scheduledFor.toUTCString()
  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 620px; margin: 0 auto; background: #f8fafc; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="padding: 24px 30px; background: #7f1d1d; color: #ffffff;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.9;">FinPay Security Notice</p>
        <h2 style="margin: 10px 0 0; font-size: 27px;">Account Deletion Scheduled</h2>
      </div>
      <div style="padding: 28px 30px;">
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 14px;">Hi ${greetingName},</p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 14px;">
          Your FinPay account has been scheduled for permanent deletion.
        </p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 14px;">
          Scheduled deletion time (UTC): <strong>${scheduledTime}</strong>
        </p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 14px; color: #334155;">
          If this was not you, cancel immediately from your account settings.
          ${cancelLink ? ` You can also use this secure link: <a href="${cancelLink}" style="color: #0ea5e9;">Cancel Deletion</a>` : ''}
        </p>
      </div>
    </div>
  `
  const text = `Hi ${greetingName}, your FinPay account is scheduled for deletion at ${scheduledTime}. If this was not you, cancel deletion immediately.${cancelLink ? ` Cancel link: ${cancelLink}` : ''}`
  const provider = await sendEmailWithConfiguredProvider(recipient, subject, text, html)

  if (provider === 'smtp') {
    logger.info(`Deletion schedule email delivered via SMTP (${resolveSmtpFrom()}) to ${maskEmail(recipient)}`)
    return
  }

  if (provider === 'resend') {
    logger.info(`Deletion schedule email delivered via Resend to ${maskEmail(recipient)}`)
    return
  }

  logger.warn(`Email provider not configured. Deletion schedule email skipped for ${recipient}`)
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
}

export async function sendSalesInquiryEmail(payload: SalesInquiryPayload): Promise<void> {
  const destination = config.salesInbox || resolveSmtpFrom() || 'support@finpay.com.ng'
  const subject = `New Contact Sales Lead: ${payload.companyName}`

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="padding: 20px 24px; background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #06b6d4 100%); color: #fff;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.85;">FinPay Sales Lead</p>
        <h2 style="margin: 8px 0 0;">New Contact Sales Request</h2>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #475569;">Name</td><td style="padding: 8px 0; font-weight: 600;">${payload.fullName}</td></tr>
          <tr><td style="padding: 8px 0; color: #475569;">Work Email</td><td style="padding: 8px 0; font-weight: 600;">${payload.workEmail}</td></tr>
          <tr><td style="padding: 8px 0; color: #475569;">Company</td><td style="padding: 8px 0; font-weight: 600;">${payload.companyName}</td></tr>
          <tr><td style="padding: 8px 0; color: #475569;">Role</td><td style="padding: 8px 0; font-weight: 600;">${payload.role}</td></tr>
          <tr><td style="padding: 8px 0; color: #475569;">Country</td><td style="padding: 8px 0; font-weight: 600;">${payload.country}</td></tr>
          <tr><td style="padding: 8px 0; color: #475569;">Monthly Volume</td><td style="padding: 8px 0; font-weight: 600;">${payload.monthlyVolume}</td></tr>
          <tr><td style="padding: 8px 0; color: #475569;">Preferred Contact</td><td style="padding: 8px 0; font-weight: 600;">${payload.preferredContact}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 14px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #475569; text-transform: uppercase; letter-spacing: 0.08em;">Message</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #0f172a;">${payload.message}</p>
        </div>
      </div>
    </div>
  `

  const text = [
    'New Contact Sales Request',
    `Name: ${payload.fullName}`,
    `Work Email: ${payload.workEmail}`,
    `Company: ${payload.companyName}`,
    `Role: ${payload.role}`,
    `Country: ${payload.country}`,
    `Monthly Volume: ${payload.monthlyVolume}`,
    `Preferred Contact: ${payload.preferredContact}`,
    `Message: ${payload.message}`,
  ].join('\n')

  const provider = await sendEmailWithConfiguredProvider(destination, subject, text, html)

  if (provider === 'smtp') {
    logger.info(`Sales inquiry delivered via SMTP to ${maskEmail(destination)}`)
    return
  }

  if (provider === 'resend') {
    logger.info(`Sales inquiry delivered via Resend to ${maskEmail(destination)}`)
    return
  }

  logger.warn(`Email provider not configured. Sales inquiry content logged for ${destination}: ${text}`)
}
