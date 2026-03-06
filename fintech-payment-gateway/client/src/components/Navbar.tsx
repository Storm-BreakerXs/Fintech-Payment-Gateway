import { Suspense, lazy, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpenText,
  Briefcase,
  Building2,
  ChevronDown,
  Code2,
  CreditCard,
  FileCode2,
  Globe2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Shield,
  Sparkles,
  Wallet,
  WalletCards,
  Webhook,
  X,
  Zap,
} from 'lucide-react'
import { useWeb3Store } from '../hooks/useWeb3'
import { clearAuthData, getStoredUser, isAuthenticated } from '../utils/auth'
import { apiRequest } from '../utils/api'

const WalletModal = lazy(() => import('./WalletModal'))

interface NavLinkItem {
  label: string
  path: string
  description: string
  icon: LucideIcon
}

interface NavGroup {
  id: string
  label: string
  path: string
  icon: LucideIcon
  items: NavLinkItem[]
  badge: string
}

const navGroups: NavGroup[] = [
  {
    id: 'products',
    label: 'Products',
    path: '/products',
    icon: WalletCards,
    badge: 'Core',
    items: [
      { label: 'Checkout', path: '/payment', description: 'Card + crypto payment flow', icon: CreditCard },
      { label: 'Product Platform', path: '/products', description: 'Unified product overview', icon: Sparkles },
      { label: 'Pricing', path: '/pricing', description: 'Usage and enterprise plans', icon: Briefcase },
      { label: 'Security', path: '/security', description: 'Architecture and controls', icon: Shield },
    ],
  },
  {
    id: 'solutions',
    label: 'Solutions',
    path: '/solutions',
    icon: Building2,
    badge: 'Industry',
    items: [
      { label: 'Solutions Hub', path: '/solutions', description: 'Use-case implementation tracks', icon: Building2 },
      { label: 'Enterprise', path: '/enterprise', description: 'Governance and scale controls', icon: Briefcase },
      { label: 'Status', path: '/status', description: 'Operational health and uptime', icon: Zap },
      { label: 'Contact Sales', path: '/contact-sales', description: 'Talk with solution specialists', icon: Globe2 },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    path: '/company',
    icon: Newspaper,
    badge: 'About',
    items: [
      { label: 'Company', path: '/company', description: 'Mission, values, and milestones', icon: Newspaper },
      { label: 'Careers', path: '/careers', description: 'Join the team', icon: Briefcase },
      { label: 'Press', path: '/press', description: 'Newsroom and updates', icon: Globe2 },
      { label: 'Blog', path: '/blog', description: 'Engineering and product notes', icon: BookOpenText },
    ],
  },
  {
    id: 'developers',
    label: 'Developers',
    path: '/developers',
    icon: Code2,
    badge: 'Build',
    items: [
      { label: 'Developer Hub', path: '/developers', description: 'Quickstart + integration flow', icon: Code2 },
      { label: 'Documentation', path: '/documentation', description: 'Guides and references', icon: FileCode2 },
      { label: 'API Reference', path: '/api-reference', description: 'Endpoint contract details', icon: BookOpenText },
      { label: 'Webhooks', path: '/status', description: 'Event handling and reliability', icon: Webhook },
    ],
  },
]

const accountLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Shield },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { address, isConnected, disconnect, balance, chainId } = useWeb3Store()
  const authenticated = isAuthenticated()
  const user = getStoredUser()

  const navItems = useMemo(() => {
    if (!authenticated) return navGroups
    return [
      ...navGroups,
      {
        id: 'workspace',
        label: 'Workspace',
        path: '/dashboard',
        icon: LayoutDashboard,
        badge: 'Ops',
        items: [
          { label: 'Dashboard', path: '/dashboard', description: 'Live transaction analytics', icon: LayoutDashboard },
          { label: 'History', path: '/transactions', description: 'Transaction ledger view', icon: History },
          { label: 'Settings', path: '/settings', description: 'Account and security controls', icon: Shield },
          { label: 'Payments', path: '/payment', description: 'Run a payment test flow', icon: CreditCard },
        ],
      },
    ]
  }, [authenticated])

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const getNetworkName = (id: number) => {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      43114: 'Avalanche',
      5: 'Goerli',
      1337: 'Local',
    }
    return networks[id] || 'Unknown'
  }

  const handleLogout = async () => {
    try {
      await apiRequest<{ message: string }>(
        '/auth/logout',
        { method: 'POST' },
        true
      )
    } catch {
      // Ignore API logout errors and clear local session regardless.
    } finally {
      clearAuthData()
      if (isConnected) disconnect()
      setIsOpen(false)
      navigate('/auth?mode=login', { replace: true })
    }
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-700/60 bg-slate-950/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Shield className="w-5 h-5 text-slate-950" />
              </div>
              <div className="hidden sm:block">
                <p className="text-lg font-bold gradient-text">FinPay</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.18em]">Payment OS</p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((group) => {
                const Icon = group.icon
                const isActive = location.pathname === group.path
                const isOpenMenu = openGroup === group.id

                return (
                  <div
                    key={group.id}
                    className="relative"
                    onMouseEnter={() => setOpenGroup(group.id)}
                    onMouseLeave={() => setOpenGroup(null)}
                  >
                    <Link
                      to={group.path}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                        isActive || isOpenMenu
                          ? 'border-cyan-300/45 bg-cyan-400/15 text-cyan-100'
                          : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{group.label}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Link>

                    <div
                      className={`absolute left-1/2 top-[calc(100%+12px)] -translate-x-1/2 w-[560px] rounded-2xl border border-slate-600/70 bg-slate-950/95 shadow-2xl transition-all ${
                        isOpenMenu ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                      }`}
                    >
                      <div className="p-4 border-b border-slate-700/70 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-100">
                          <Icon className="w-4 h-4 text-cyan-200" />
                          <span className="font-semibold">{group.label}</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-100 rounded-full border border-cyan-300/35 bg-cyan-400/15 px-2 py-1">
                          {group.badge}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-3">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setOpenGroup(null)}
                              className="rounded-xl border border-slate-700/70 bg-slate-900/55 p-3 hover:border-cyan-300/35 hover:bg-slate-800/70 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-cyan-400/15 border border-cyan-300/30 flex items-center justify-center flex-shrink-0">
                                  <ItemIcon className="w-4 h-4 text-cyan-100" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">{item.label}</p>
                                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {authenticated && (
                <span className="text-sm text-slate-300">{user?.firstName ? `Hi, ${user.firstName}` : 'Signed in'}</span>
              )}

              <Link
                to="/contact-sales"
                className="hidden xl:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-300/35 bg-cyan-400/15 text-cyan-100 text-sm font-semibold hover:bg-cyan-400/25 transition-colors"
              >
                <Globe2 className="w-4 h-4" />
                <span>Contact Sales</span>
              </Link>

              {!authenticated && (
                <Link
                  to="/auth?mode=register"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-sm font-semibold"
                >
                  <span>Sign Up</span>
                </Link>
              )}

              {authenticated && !isConnected && (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-sm font-semibold"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect</span>
                </button>
              )}

              {authenticated && isConnected && address && (
                <div className="relative group">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-300/35 bg-emerald-500/15 text-emerald-100 text-sm">
                    <Wallet className="w-4 h-4" />
                    <span>{formatAddress(address)}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-950/95 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="text-xs text-slate-400 mb-2">Network: {getNetworkName(chainId || 1)}</div>
                    <div className="text-sm text-emerald-200 mb-3">{parseFloat(balance || '0').toFixed(4)} ETH</div>
                    <button
                      onClick={disconnect}
                      className="w-full px-3 py-2 rounded-lg border border-red-400/35 bg-red-500/15 text-red-200 text-sm"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              )}

              {authenticated && (
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/70"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-slate-700/70 bg-slate-950/95">
            <div className="px-4 py-4 space-y-4 max-h-[75vh] overflow-auto">
              {navGroups.map((group) => {
                const GroupIcon = group.icon
                return (
                  <div key={group.id} className="rounded-xl border border-slate-700/70 bg-slate-900/65 p-3">
                    <Link
                      to={group.path}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-2 text-cyan-100 font-semibold mb-3"
                    >
                      <GroupIcon className="w-4 h-4" />
                      <span>{group.label}</span>
                    </Link>
                    <div className="space-y-2">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 text-slate-300 hover:text-white"
                          >
                            <ItemIcon className="w-4 h-4 text-cyan-200" />
                            <span className="text-sm">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {authenticated && (
                <div className="rounded-xl border border-slate-700/70 bg-slate-900/65 p-3 space-y-2">
                  {accountLinks.map((item) => {
                    const ItemIcon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 text-slate-300 hover:text-white"
                      >
                        <ItemIcon className="w-4 h-4 text-cyan-200" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}

              <Link
                to="/contact-sales"
                onClick={() => setIsOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-cyan-300/35 bg-cyan-400/15 text-cyan-100 font-semibold"
              >
                <Globe2 className="w-4 h-4" />
                <span>Contact Sales</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {showWalletModal && (
        <Suspense fallback={null}>
          <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
        </Suspense>
      )}
    </>
  )
}
