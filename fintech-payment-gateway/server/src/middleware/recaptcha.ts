import { Request, RequestHandler, Response, NextFunction } from 'express'
import { config } from '../config/env'
import { logger } from '../utils/logger'

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

interface RecaptchaVerifyResponse {
  success: boolean
  score?: number
  action?: string
  hostname?: string
  challenge_ts?: string
  'error-codes'?: string[]
}

function getClientIp(req: Request): string | undefined {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  if (forwarded) {
    return forwarded
  }

  const direct = String(req.ip || '').trim()
  return direct || undefined
}

function getCaptchaToken(req: Request): string {
  const payload = (req.body || {}) as Record<string, unknown>
  const token = payload.captchaToken ?? payload.recaptchaToken ?? ''
  return String(token).trim()
}

async function verifyRecaptchaToken(token: string, remoteIp?: string): Promise<RecaptchaVerifyResponse> {
  const body = new URLSearchParams({
    secret: config.recaptchaSecretKey,
    response: token,
  })

  if (remoteIp) {
    body.set('remoteip', remoteIp)
  }

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error(`reCAPTCHA siteverify failed with status ${response.status}`)
  }

  const payload = await response.json() as RecaptchaVerifyResponse
  return payload
}

export function requireRecaptcha(expectedAction: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.recaptchaEnabled) {
      next()
      return
    }

    const token = getCaptchaToken(req)
    if (!token) {
      res.status(400).json({
        error: 'Captcha verification is required.',
        code: 'CAPTCHA_REQUIRED',
      })
      return
    }

    try {
      const verification = await verifyRecaptchaToken(token, getClientIp(req))

      if (!verification.success) {
        logger.warn(
          `reCAPTCHA failed for action=${expectedAction}; errors=${(verification['error-codes'] || []).join(',') || 'none'}`
        )
        res.status(403).json({
          error: 'Captcha verification failed. Please try again.',
          code: 'CAPTCHA_FAILED',
        })
        return
      }

      if (typeof verification.score === 'number' && verification.score < config.recaptchaMinScore) {
        logger.warn(
          `reCAPTCHA low score for action=${expectedAction}; score=${verification.score}`
        )
        res.status(403).json({
          error: 'Captcha verification score is too low. Please retry.',
          code: 'CAPTCHA_LOW_SCORE',
        })
        return
      }

      if (verification.action && verification.action !== expectedAction) {
        logger.warn(
          `reCAPTCHA action mismatch. expected=${expectedAction}, actual=${verification.action}`
        )
        res.status(403).json({
          error: 'Captcha verification failed. Please refresh and try again.',
          code: 'CAPTCHA_ACTION_MISMATCH',
        })
        return
      }

      next()
    } catch (error: any) {
      logger.error(`reCAPTCHA verification request failed for action=${expectedAction}: ${error?.message || error}`)
      res.status(503).json({
        error: 'Captcha service is temporarily unavailable. Please try again.',
        code: 'CAPTCHA_UNAVAILABLE',
      })
    }
  }
}
