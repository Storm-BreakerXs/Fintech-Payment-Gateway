import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Bitcoin, 
  ArrowRight, 
  CheckCircle, 
  Shield,
  Lock,
  RefreshCw,
  Copy,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Card3D from '../components/Card3D'
import { useWeb3Store } from '../hooks/useWeb3'
import toast from 'react-hot-toast'

type PaymentMethod = 'card' | 'crypto'
type PaymentStep = 'amount' | 'details' | 'confirm' | 'processing' | 'success'
const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV
    ? 'http://localhost:3001/api'
    : 'https://fintech-payment-gateway.onrender.com/api')

export default function Payment() {
  const [searchParams] = useSearchParams()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [step, setStep] = useState<PaymentStep>('amount')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [transactionId, setTransactionId] = useState('')
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
  })
  const [isFlipped, setIsFlipped] = useState(false)
  const [cryptoAddress] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')

  const { isConnected, connect } = useWeb3Store()

  const fiatCurrencies = ['USD', 'EUR', 'GBP']
  const cryptoCurrencies = ['ETH', 'BTC', 'USDC', 'USDT']
  const currencies = paymentMethod === 'card' ? fiatCurrencies : cryptoCurrencies

  useEffect(() => {
    const status = searchParams.get('status')
    const sessionId = searchParams.get('session_id')

    if (status === 'success') {
      setTransactionId(sessionId || '')
      setStep('success')
    }

    if (status === 'cancel') {
      setStep('confirm')
      toast.error('Payment was canceled.')
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

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (parseFloat(amount) > 0) {
      setStep('details')
    }
  }

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('confirm')
  }

  const handleConfirm = async () => {
    setStep('processing')

    if (paymentMethod === 'card') {
      try {
        const response = await fetch(`${API_BASE_URL}/payments/card/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            currency,
            merchantName: 'FinPay Gateway',
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.checkoutUrl) {
          throw new Error(data?.message || data?.error || 'Unable to start card payment.')
        }

        window.location.href = data.checkoutUrl
        return
      } catch (error: any) {
        toast.error(error.message || 'Card payment initialization failed.')
        setStep('confirm')
        return
      }
    }

    // Keep crypto as an in-app demo confirmation.
    await new Promise(resolve => setTimeout(resolve, 3000))
    setTransactionId(`0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`)
    setStep('success')
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(cryptoAddress)
    toast.success('Address copied to clipboard!')
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    }
    return v
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Make a Payment</h1>
        <p className="text-slate-400">Choose your preferred payment method</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center space-x-4">
          {['Amount', 'Details', 'Confirm', 'Complete'].map((label, index) => {
            const stepIndex = ['amount', 'details', 'confirm', 'success'].indexOf(step)
            const isActive = index <= stepIndex
            const isCurrent = index === stepIndex

            return (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                  isActive 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-800 text-slate-500'
                } ${isCurrent ? 'ring-4 ring-emerald-500/30' : ''}`}>
                  {isActive && index < stepIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-16 h-1 mx-2 transition-all ${
                    index < stepIndex ? 'bg-emerald-500' : 'bg-slate-800'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left side - Payment Form */}
        <div>
          <AnimatePresence mode="wait">
            {step === 'amount' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-8 border border-slate-700"
              >
                <h2 className="text-2xl font-bold mb-6">Enter Amount</h2>

                {/* Payment Method Tabs */}
                <div className="flex space-x-4 mb-8">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl border transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('crypto')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl border transition-all ${
                      paymentMethod === 'crypto'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Bitcoin className="w-5 h-5" />
                    <span className="font-medium">Crypto</span>
                  </button>
                </div>

                <form onSubmit={handleAmountSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Amount
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                          {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''}
                        </span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-2xl font-mono placeholder-slate-600 focus:border-emerald-500 transition-colors"
                          required
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 transition-colors"
                      >
                        {currencies.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-lift"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-slate-500">
                  <Lock className="w-4 h-4" />
                  <span>Secure, encrypted payment processing</span>
                </div>
              </motion.div>
            )}

            {step === 'details' && paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-8 border border-slate-700"
              >
                <h2 className="text-2xl font-bold mb-6">Card Details</h2>

                <form onSubmit={handleCardSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-600 focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Card Holder
                    </label>
                    <input
                      type="text"
                      value={cardData.holder}
                      onChange={(e) => setCardData({ ...cardData, holder: e.target.value.toUpperCase() })}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="JOHN DOE"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '')
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2, 4)
                          }
                          setCardData({ ...cardData, expiry: value })
                        }}
                        onFocus={() => setIsFlipped(false)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-600 focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        CVV
                      </label>
                      <input
                        type="password"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        onFocus={() => setIsFlipped(true)}
                        onBlur={() => setIsFlipped(false)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-600 focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep('amount')}
                      className="flex-1 px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 'details' && paymentMethod === 'crypto' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-8 border border-slate-700"
              >
                <h2 className="text-2xl font-bold mb-6">Crypto Payment</h2>

                {!isConnected ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <Bitcoin className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400 mb-6">Connect your wallet to continue</p>
                    <button
                      onClick={() => connect('metamask')}
                      className="flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift mx-auto"
                    >
                      <span>Connect Wallet</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-xl">
                        <QRCodeSVG 
                          value={cryptoAddress} 
                          size={200}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Send {amount} {currency} to:
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={cryptoAddress}
                          readOnly
                          className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm"
                        />
                        <button
                          onClick={copyAddress}
                          className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <Shield className="w-4 h-4" />
                      <span>Payment will be detected automatically</span>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setStep('amount')}
                        className="flex-1 px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep('confirm')}
                        className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift"
                      >
                        <span>I've Sent</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass rounded-2xl p-8 border border-slate-700"
              >
                <h2 className="text-2xl font-bold mb-6">Confirm Payment</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-3 border-b border-slate-800">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-xl font-bold text-white">
                      {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''}
                      {amount} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-800">
                    <span className="text-slate-400">Payment Method</span>
                    <span className="text-white capitalize">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-800">
                    <span className="text-slate-400">Network Fee</span>
                    <span className="text-white">{paymentMethod === 'crypto' ? '~$2.50' : '$0.00'}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-slate-400">Total</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : ''}
                      {parseFloat(amount) + (paymentMethod === 'crypto' ? 2.5 : 0)} {currency}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep('details')}
                    className="flex-1 px-6 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium hover:bg-slate-700 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift"
                  >
                    <Lock className="w-5 h-5" />
                    <span>Confirm Payment</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-12 border border-slate-700 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
                <p className="text-slate-400">Please wait while we process your transaction...</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-12 border border-emerald-500/30 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-slate-400 mb-6">Your transaction has been completed successfully.</p>
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                  <div className="text-sm text-slate-400 mb-1">Transaction ID</div>
                  <div className="font-mono text-emerald-400">{transactionId || 'pending'}</div>
                </div>
                <button
                  onClick={() => {
                    setStep('amount')
                    setAmount('')
                    setCurrency('USD')
                    setTransactionId('')
                    setCardData({ number: '', holder: '', expiry: '', cvv: '' })
                  }}
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift"
                >
                  <span>Make Another Payment</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side - 3D Card Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-32">
            <Card3D
              cardNumber={cardData.number || '•••• •••• •••• ••••'}
              cardHolder={cardData.holder || 'YOUR NAME'}
              expiryDate={cardData.expiry || 'MM/YY'}
              cvv={cardData.cvv || '•••'}
              isFlipped={isFlipped}
              cardType="visa"
            />

            <div className="mt-8 glass rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Secure Payment</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>256-bit SSL encryption</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>PCI DSS compliant</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Fraud protection</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Instant confirmation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
