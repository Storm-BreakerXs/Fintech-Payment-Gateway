import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, AlertCircle } from 'lucide-react'
import { WalletType, useWeb3Store } from '../hooks/useWeb3'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

const wallets: Array<{
  id: WalletType
  name: string
  description: string
  icon: string
  color: string
}> = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Connect to your MetaMask wallet',
    icon: '🦊',
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Scan QR with Coinbase Wallet app (no browser extension)',
    icon: '🔗',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Use Coinbase extension or Coinbase deep-link flow',
    icon: 'C',
    color: 'from-blue-400 to-blue-500',
  },
]

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { connect } = useWeb3Store()

  const handleConnect = async (walletId: WalletType) => {
    setIsConnecting(true)
    setError(null)

    try {
      await connect(walletId)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-strong rounded-2xl border border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                  <p className="text-sm text-slate-400">Choose your preferred wallet</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wallet Options */}
            <div className="p-6 space-y-3">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              {wallets.map((wallet) => (
                <motion.button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  disabled={isConnecting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${wallet.color} flex items-center justify-center text-xl font-bold text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                    {wallet.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white">{wallet.name}</h3>
                    <p className="text-sm text-slate-400">{wallet.description}</p>
                  </div>
                  {isConnecting && (
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-900/50 border-t border-slate-800">
              <p className="text-center text-sm text-slate-500">
                By connecting, you agree to our{' '}
                <a href="#" className="text-emerald-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-emerald-400 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
