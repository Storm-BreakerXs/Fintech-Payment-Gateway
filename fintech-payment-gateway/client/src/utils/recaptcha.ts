const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() || ''
const recaptchaEnabled = (
  import.meta.env.VITE_RECAPTCHA_ENABLED?.trim()
  || (siteKey ? 'true' : 'false')
).toLowerCase() === 'true'

const RECAPTCHA_SCRIPT_ID = 'finpay-recaptcha-script'

type Grecaptcha = {
  ready: (callback: () => void) => void
  execute: (key: string, options: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

let scriptLoadPromise: Promise<void> | null = null

function shouldUseRecaptcha(): boolean {
  return typeof window !== 'undefined' && recaptchaEnabled && Boolean(siteKey)
}

function loadRecaptchaScript(): Promise<void> {
  if (!shouldUseRecaptcha()) {
    return Promise.resolve()
  }

  if (window.grecaptcha) {
    return Promise.resolve()
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise
  }

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Unable to load reCAPTCHA script.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = RECAPTCHA_SCRIPT_ID
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load reCAPTCHA script.'))
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

export async function executeRecaptcha(action: string): Promise<string> {
  if (!shouldUseRecaptcha()) {
    return ''
  }

  await loadRecaptchaScript()

  const grecaptcha = window.grecaptcha
  if (!grecaptcha) {
    throw new Error('reCAPTCHA failed to initialize. Please refresh and try again.')
  }

  return new Promise<string>((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(siteKey, { action })
        .then((token) => {
          if (!token) {
            reject(new Error('Captcha token was not generated. Please try again.'))
            return
          }
          resolve(token)
        })
        .catch(() => {
          reject(new Error('Captcha verification failed. Please try again.'))
        })
    })
  })
}

export function isRecaptchaEnabled(): boolean {
  return shouldUseRecaptcha()
}
