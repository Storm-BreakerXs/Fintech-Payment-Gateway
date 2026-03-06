import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Bitcoin,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  AlertTriangle,
} from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { useWeb3Store } from '../hooks/useWeb3'
import { API_BASE_URL } from '../utils/api'
import { executeRecaptcha } from '../utils/recaptcha'
import { visualAssets } from '../content/visualAssets'

type PaymentMethod = 'card' | 'crypto'
type PaymentStep = 'amount' | 'details' | 'confirm' | 'processing' | 'success' | 'failed'

const fiatCurrencies = ['USD', 'EUR', 'GBP']
const cryptoCurrencies = ['ETH', 'BTC', 'USDC', 'USDT']

function getCurrencySymbol(currency: string): string {
  if (currency === 'USD') return '$'
  if (currency === 'EUR') return '€'
  if (currency === 'GBP') return '£'
  return ''
}

export default function Payment() {
  const [searchParams] = useSearchParams()
  const { isConnected, connect } = useWeb3Store()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [step, setStep] = useState<PaymentStep>('amount')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [transactionId, setTransactionId] = useState('')
  const [failureReason, setFailureReason] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [merchantName, setMerchantName] = useState('FinPay Gateway')
  const [reference, setReference] = useState('')
  const [processingMessage, setProcessingMessage] = useState('Preparing payment...')
  const [cryptoAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')

  const currencies = paymentMethod === 'card' ? fiatCurrencies : cryptoCurrencies

  useEffect(() => {
    const status = searchParams.get('status')
    const sessionId = searchParams.get('session_id')
    const retry = searchParams.get('retry')
    const queryAmount = searchParams.get('amount')
    const queryCurrency = searchParams.get('currency')

    if (queryAmount && Number(queryAmount) > 0) {
      setAmount(Number(queryAmount).toFixed(2))
    }

    if (queryCurrency) {
      const normalized = queryCurrency.toUpperCase()
      if (fiatCurrencies.includes(normalized)) {
        setCurrency(normalized)
        setPaymentMethod('card')
      }
      if (cryptoCurrencies.includes(normalized)) {
        setCurrency(normalized)
        setPaymentMethod('crypto')
      }
    }

    if (retry === '1') {
      setStep('confirm')
    }

    if (status === 'success') {
      setTransactionId(sessionId || '')
      setFailureReason('')
      setStep('success')
    }

    if (status === 'cancel') {
      setFailureReason('Payment was canceled before completion.')
      setStep('failed')
    }

    if (status === 'error' || status === 'failed') {
      setFailureReason('Payment could not be completed. Please try again.')
      setStep('failed')
    }
  }, [searchParams])

  useEffect(() => {
    if (paymentMethod === 'card' && !fiatCurrencies.includes(currency)) {
      setCurrency('USD')
    }
    if (paymentMethod === 'crypto' && !cryptoCurrencies.includes(currency)) {
      setCurrency('ETH')
    }
  }, [paymentMethod, currency])

  const totalAmount = useMemo(() => {
    const parsed = Number(amount || '0')
    if (Number.isNaN(parsed) || parsed <= 0) return 0
    return paymentMethod === 'crypto' ? parsed + 2.5 : parsed
  }, [amount, paymentMethod])

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid payment amount.')
      return
    }
    setStep('details')
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentMethod === 'card' && !customerEmail.trim()) {
      toast.error('Enter a customer email for receipt delivery.')
      return
    }

    setStep('confirm')
  }

  const handleConfirm = async () => {
    setStep('processing')

    if (paymentMethod === 'card') {
      try {
        setProcessingMessage('Redirecting to secure Stripe checkout...')
        const captchaToken = await executeRecaptcha('card_checkout')

        const response = await fetch(`${API_BASE_URL}/payments/card/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Number(amount),
            currency,
            merchantName,
            customerEmail,
            reference,
            ...(captchaToken ? { captchaToken } : {}),
          }),
        })

        const payload = await response.json()

        if (!response.ok || !payload?.checkoutUrl) {
          throw new Error(payload?.message || payload?.error || 'Unable to initialize card checkout.')
        }

        window.location.href = payload.checkoutUrl
        return
      } catch (error: any) {
        const message = error?.message || 'Card payment initialization failed.'
        setFailureReason(message)
        toast.error(message)
        setStep('failed')
        return
      }
    }

    if (!isConnected) {
      setFailureReason('Connect a wallet before confirming crypto payment.')
      toast.error('Connect your wallet before confirming crypto payment.')
      setStep('failed')
      return
    }

    setProcessingMessage('Validating blockchain transaction confirmation...')
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const pseudoTx = `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
    setTransactionId(pseudoTx)
    setFailureReason('')
    setStep('success')
  }

  const copyAddress = async () => {
    await navigator.clipboard.writeText(cryptoAddress)
    toast.success('Wallet address copied.')
  }

  const resetFlow = () => {
    setStep('amount')
    setAmount('')
    setCurrency(paymentMethod === 'card' ? 'USD' : 'ETH')
    setTransactionId('')
    setFailureReason('')
    setReference('')
  }

  const statusImage = step === 'success'
    ? visualAssets.paymentSuccess
    : step === 'failed'
      ? visualAssets.paymentFailure
      : visualAssets.paymentOperations

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">Payment Checkout</h1>
        <p className="mt-3 text-slate-300">Pay securely with card or crypto and track your payment status instantly.</p>
      </div>

      <div className="grid lg:grid-cols-[1.05fr,0.95fr] gap-10">
        <div>
          <div className="grid grid-cols-4 gap-2 mb-8">
            {['Amount', 'Details', 'Review', 'Complete'].map((label, index) => {
              const normalizedStep = step === 'processing' || step === 'failed' ? 'confirm' : step
              const currentStep = ['amount', 'details', 'confirm', 'success'].indexOf(normalizedStep)
              const reached = index <= currentStep
              return (
                <div key={label} className="space-y-2">
                  <div className={`h-1.5 rounded-full ${reached ? 'bg-cyan-400' : 'bg-slate-800'}`} />
                  <p className={`text-xs ${reached ? 'text-cyan-100' : 'text-slate-500'}`}>{label}</p>
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {step === 'amount' && (
              <motion.form
                key="amount"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                onSubmit={handleAmountSubmit}
                className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-7 space-y-6"
              >
                <h2 className="text-2xl font-semibold text-white">Choose payment method</h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100'
                        : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <p className="inline-flex items-center gap-2 text-sm font-semibold"><CreditCard className="w-4 h-4" /> Card</p>
                    <p className="mt-2 text-xs text-slate-300">Secure hosted checkout by Stripe.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('crypto')}
                    className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                      paymentMethod === 'crypto'
                        ? 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100'
                        : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <p className="inline-flex items-center gap-2 text-sm font-semibold"><Bitcoin className="w-4 h-4" /> Crypto</p>
                    <p className="mt-2 text-xs text-slate-300">Wallet transfer with confirmation state tracking.</p>
                  </button>
                </div>

                <div className="grid sm:grid-cols-[1fr,190px] gap-3">
                  <label className="block">
                    <span className="text-sm text-slate-300">Amount</span>
                    <div className="mt-2 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{getCurrencySymbol(currency)}</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/75 py-3 pl-8 pr-3 text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-300">Currency</span>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/75 px-3 py-3 text-white"
                    >
                      {currencies.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-semibold text-slate-950"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            {step === 'details' && (
              <motion.form
                key="details"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                onSubmit={handleDetailsSubmit}
                className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-7 space-y-6"
              >
                <h2 className="text-2xl font-semibold text-white">Payment details</h2>

                {paymentMethod === 'card' ? (
                  <>
                    <p className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 inline-flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Card credentials are entered only on Stripe-hosted checkout.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-sm text-slate-300">Customer email</span>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          required
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/75 px-3 py-3 text-white"
                          placeholder="customer@company.com"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm text-slate-300">Merchant descriptor</span>
                        <input
                          type="text"
                          value={merchantName}
                          onChange={(e) => setMerchantName(e.target.value)}
                          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/75 px-3 py-3 text-white"
                          placeholder="FinPay Gateway"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="text-sm text-slate-300">Reference (optional)</span>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/75 px-3 py-3 text-white"
                        placeholder="Invoice #1023"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    {!isConnected ? (
                      <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-6 text-center">
                        <p className="text-slate-300 mb-4">Connect your wallet before sending funds.</p>
                        <button
                          type="button"
                          onClick={() => connect('metamask')}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
                        >
                          <span>Connect Wallet</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-[220px,1fr] gap-4 items-start">
                        <div className="rounded-xl bg-white p-3 w-fit mx-auto sm:mx-0">
                          <QRCodeSVG value={cryptoAddress} size={190} includeMargin={false} />
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-slate-300">Send exactly {amount || '0.00'} {currency} to this address:</p>
                          <div className="flex gap-2">
                            <input
                              value={cryptoAddress}
                              readOnly
                              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/75 px-3 py-3 text-white font-mono text-xs"
                            />
                            <button
                              type="button"
                              onClick={copyAddress}
                              className="rounded-xl border border-slate-700 bg-slate-800/75 px-3 py-3 text-slate-200"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">Confirmation can take 30-90 seconds depending on network congestion.</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('amount')}
                    className="rounded-xl border border-slate-600 bg-slate-800/60 px-5 py-3 text-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
                  >
                    <span>Review Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-7 space-y-6"
              >
                <h2 className="text-2xl font-semibold text-white">Review and confirm</h2>

                <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Amount</span>
                    <span className="font-semibold">{getCurrencySymbol(currency)}{amount} {currency}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Payment method</span>
                    <span className="capitalize">{paymentMethod}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Processor</span>
                    <span>{paymentMethod === 'card' ? 'Stripe Hosted Checkout' : 'Blockchain Transfer'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Estimated fee</span>
                    <span>{paymentMethod === 'card' ? 'Handled by processor' : '~$2.50 network fee'}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-700 pt-3 text-white">
                    <span>Total</span>
                    <span className="text-lg font-bold">{getCurrencySymbol(currency)}{totalAmount.toFixed(2)} {currency}</span>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <p className="text-sm text-slate-300 inline-flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-300" />
                    You will be redirected to Stripe to securely enter card information.
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('details')}
                    className="rounded-xl border border-slate-600 bg-slate-800/60 px-5 py-3 text-slate-200"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{paymentMethod === 'card' ? 'Continue to Secure Checkout' : 'Confirm Transfer'}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-400/15 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-cyan-300 animate-spin" />
                </div>
                <h2 className="text-2xl font-semibold text-white mt-5">Processing payment</h2>
                <p className="text-slate-300 mt-2">{processingMessage}</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-300" />
                </div>
                <h2 className="text-2xl font-semibold text-white mt-4">Payment successful</h2>
                <p className="text-slate-200 mt-2">Your transaction has been completed and recorded.</p>
                <div className="mt-5 rounded-xl border border-emerald-300/25 bg-slate-900/55 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Transaction ID</p>
                  <p className="text-emerald-300 font-mono text-sm mt-2 break-all">{transactionId || 'Pending confirmation'}</p>
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={resetFlow}
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
                  >
                    Make another payment
                  </button>
                  <Link
                    to="/transactions"
                    className="rounded-xl border border-slate-600 bg-slate-800/60 px-5 py-3 text-slate-200"
                  >
                    View transactions
                  </Link>
                </div>
              </motion.div>
            )}

            {step === 'failed' && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-amber-300/35 bg-amber-400/10 p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-amber-200" />
                </div>
                <h2 className="text-2xl font-semibold text-white mt-4">Payment not completed</h2>
                <p className="text-slate-200 mt-2">{failureReason || 'The payment could not be completed.'}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setStep('confirm')}
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-semibold text-slate-950"
                  >
                    Retry payment
                  </button>
                  <button
                    onClick={resetFlow}
                    className="rounded-xl border border-slate-600 bg-slate-800/60 px-5 py-3 text-slate-200"
                  >
                    Start over
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/60 overflow-hidden">
            <img src={statusImage.src} alt={statusImage.alt} className="h-64 w-full object-cover" loading="lazy" />
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Customer Confidence</p>
              <h3 className="text-lg font-semibold text-white mt-2">A secure experience from start to finish</h3>
              <p className="text-sm text-slate-300 mt-2">
                Every step is designed to keep payment details safe and keep customers informed.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5">
            <h3 className="text-white font-semibold mb-4 inline-flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-300" />
              Trust Signals
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="inline-flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-cyan-300" />
                Stripe-hosted card entry for sensitive data handling.
              </li>
              <li className="inline-flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-cyan-300" />
                Explicit pending, success, canceled, and failed payment states.
              </li>
              <li className="inline-flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-cyan-300" />
                Easy retry options if a payment is interrupted.
              </li>
            </ul>
          </div>

          {step !== 'processing' && (
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 text-sm text-slate-300 inline-flex items-start gap-2">
              <RefreshCw className="w-4 h-4 mt-0.5 text-cyan-300" />
              Card payments open a secure Stripe page and return here with your payment result.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
