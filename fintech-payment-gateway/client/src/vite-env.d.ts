/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_RECAPTCHA_ENABLED?: string
  readonly VITE_RECAPTCHA_SITE_KEY?: string
  readonly VITE_COINBASE_APP_NAME?: string
  readonly VITE_COINBASE_APP_LOGO_URL?: string
  readonly VITE_COINBASE_CHAIN_ID?: string
  readonly VITE_COINBASE_RPC_URL?: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
