import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wallet, 
  CreditCard, 
  LayoutDashboard, 
  History, 
  Settings, 
  Menu, 
  X,
  Shield,
  ChevronDown,
  LogOut
} from 'lucide-react'
import { useWeb3Store } from '../hooks/useWeb3'
import WalletModal from './WalletModal'
import { clearAuthData, getStoredUser, isAuthenticated } from '../utils/auth'

const navItems = [
  { path: '/', label: 'Home', icon: CreditCard },
  { path: '/payment', label: 'Payment', icon: CreditCard },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { address, isConnected, disconnect, balance, chainId } = useWeb3Store()
  const authenticated = isAuthenticated()
  const user = getStoredUser()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getNetworkName = (chainId: number) => {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      43114: 'Avalanche',
      5: 'Goerli',
      1337: 'Local',
    }
    return networks[chainId] || 'Unknown'
  }

  const handleLogout = () => {
    clearAuthData()
    if (isConnected) {
      disconnect()
    }
    setIsOpen(false)
    navigate('/auth?mode=login', { replace: true })
  }

  return (
    <>
      <nav className="sticky top-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">FinPay</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Wallet Connection */}
            <div className="hidden md:flex items-center space-x-4">
              {authenticated && (
                <>
                  <span className="text-sm text-slate-300">
                    {user?.firstName ? `Hi, ${user.firstName}` : 'Signed in'}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </>
              )}
              {isConnected && address ? (
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400">
                      {getNetworkName(chainId || 1)}
                    </span>
                    <span className="text-sm font-mono text-emerald-400">
                      {parseFloat(balance || '0').toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="relative group">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all">
                      <Wallet className="w-4 h-4" />
                      <span className="text-sm font-medium">{formatAddress(address)}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 rounded-xl glass-strong border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <button
                        onClick={disconnect}
                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-strong border-t border-slate-800"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
                {authenticated && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-white/5 transition-all mt-4"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                )}
                {!isConnected && (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowWalletModal(true)
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium mt-4"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </>
  )
}
