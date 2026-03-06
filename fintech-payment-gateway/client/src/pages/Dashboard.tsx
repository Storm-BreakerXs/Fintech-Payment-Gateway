import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  TrendingUp,
  DollarSign,
  CreditCard,
  Bitcoin,
  CheckCircle2,
  Download,
  Loader2,
  Shield,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import toast from 'react-hot-toast'
import { apiRequest } from '../utils/api'
import { visualAssets } from '../content/visualAssets'

type TimeRange = '24h' | '7d' | '30d' | '90d'

type TransactionType = 'card' | 'crypto' | 'bank'
type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'

interface Transaction {
  _id: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  merchantName?: string
  createdAt: string
  txHash?: string
}

interface HistoryResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const rangeToMs: Record<TimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
}

const paymentMethodColors: Record<TransactionType, string> = {
  card: '#10b981',
  crypto: '#3b82f6',
  bank: '#8b5cf6',
}

function formatAmount(tx: Transaction): string {
  if (tx.currency === 'USD') return `$${tx.amount.toFixed(2)} ${tx.currency}`
  if (tx.currency === 'ETH') return `ETH ${tx.amount.toFixed(4)}`
  if (tx.currency === 'BTC') return `BTC ${tx.amount.toFixed(6)}`
  return `${tx.amount.toFixed(2)} ${tx.currency}`
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      setIsLoading(true)
      try {
        const data = await apiRequest<HistoryResponse>('/payments/history?page=1&limit=200', {}, true)
        setTransactions(data.transactions || [])
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Could not load dashboard data.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const scopedTransactions = useMemo(() => {
    const cutoff = Date.now() - rangeToMs[timeRange]
    return transactions
      .filter((tx) => new Date(tx.createdAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [transactions, timeRange])

  const completedTransactions = useMemo(
    () => scopedTransactions.filter((tx) => tx.status === 'completed'),
    [scopedTransactions]
  )

  const stats = useMemo(() => {
    const totalFiatVolume = completedTransactions
      .filter((tx) => tx.currency === 'USD')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const cryptoCount = scopedTransactions.filter((tx) => tx.type === 'crypto').length
    const successRate = scopedTransactions.length
      ? (completedTransactions.length / scopedTransactions.length) * 100
      : 0

    return [
      {
        title: 'Fiat Volume (USD)',
        value: `$${totalFiatVolume.toFixed(2)}`,
        icon: DollarSign,
        iconClasses: 'bg-emerald-500/20 text-emerald-400',
      },
      {
        title: 'Transactions',
        value: String(scopedTransactions.length),
        icon: CreditCard,
        iconClasses: 'bg-blue-500/20 text-blue-400',
      },
      {
        title: 'Crypto Transactions',
        value: String(cryptoCount),
        icon: Bitcoin,
        iconClasses: 'bg-purple-500/20 text-purple-400',
      },
      {
        title: 'Success Rate',
        value: `${successRate.toFixed(1)}%`,
        icon: CheckCircle2,
        iconClasses: 'bg-orange-500/20 text-orange-400',
      },
    ]
  }, [completedTransactions, scopedTransactions])

  const revenueData = useMemo(() => {
    const grouped = new Map<string, number>()

    completedTransactions
      .filter((tx) => tx.currency === 'USD')
      .forEach((tx) => {
        const key = new Date(tx.createdAt).toISOString().slice(0, 10)
        grouped.set(key, (grouped.get(key) || 0) + tx.amount)
      })

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([dateKey, total]) => ({
        name: new Date(`${dateKey}T00:00:00Z`).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        value: Number(total.toFixed(2)),
      }))
  }, [completedTransactions])

  const paymentMethodsData = useMemo(() => {
    const counts: Record<TransactionType, number> = {
      card: 0,
      crypto: 0,
      bank: 0,
    }

    scopedTransactions.forEach((tx) => {
      counts[tx.type] += 1
    })

    const total = counts.card + counts.crypto + counts.bank
    if (!total) return []

    return ([
      { name: 'Card', key: 'card' },
      { name: 'Crypto', key: 'crypto' },
      { name: 'Bank', key: 'bank' },
    ] as const)
      .filter((item) => counts[item.key] > 0)
      .map((item) => ({
        name: item.name,
        value: Number(((counts[item.key] / total) * 100).toFixed(1)),
        color: paymentMethodColors[item.key],
      }))
  }, [scopedTransactions])

  const recentTransactions = scopedTransactions.slice(0, 5)

  const exportCsv = () => {
    if (!scopedTransactions.length) {
      toast.error('No transactions to export for the selected range.')
      return
    }

    const csvRows = [
      'id,type,merchant,date,amount,currency,status',
      ...scopedTransactions.map((tx) => {
        const merchant = (tx.merchantName || 'N/A').replace(/,/g, ' ')
        const date = new Date(tx.createdAt).toISOString()
        return `${tx._id},${tx.type},${merchant},${date},${tx.amount},${tx.currency},${tx.status}`
      }),
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dashboard-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-slate-400">Overview of your live payment activity</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 transition-colors"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={exportCsv}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="mb-8 rounded-3xl border border-slate-700/80 bg-slate-900/60 overflow-hidden">
        <div className="grid lg:grid-cols-[1.2fr,0.8fr]">
          <div className="p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Business Snapshot</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Monitor performance and act on failures faster</h2>
            <p className="mt-3 text-sm text-slate-300 max-w-2xl">
              Track volume, success rates, and recent payment activity in one place.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/transactions"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
              >
                <span>Open Transactions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/payment"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/65 px-4 py-2.5 text-sm text-slate-200"
              >
                <Shield className="w-4 h-4 text-cyan-300" />
                <span>Create Payment</span>
              </Link>
            </div>
          </div>
          <img
            src={visualAssets.analyticsCenter.src}
            alt={visualAssets.analyticsCenter.alt}
            className="h-full min-h-[220px] w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="home-surface rounded-2xl border border-slate-700 p-10 flex items-center justify-center space-x-3 text-slate-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="home-surface rounded-2xl p-6 border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.iconClasses}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>{timeRange}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.title}</div>
                </motion.div>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 home-surface rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Revenue Overview (USD)</h2>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>{revenueData.length ? 'Live data' : 'No completed USD transactions yet'}</span>
                </div>
              </div>
              <div className="h-64">
                {revenueData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-sm text-slate-400 gap-2">
                    <span>No chart data available for this period.</span>
                    <Link to="/payment" className="text-cyan-200 hover:text-cyan-100 transition-colors">Create your first payment to see analytics.</Link>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="home-surface rounded-2xl p-6 border border-slate-700"
            >
              <h2 className="text-lg font-semibold mb-6">Payment Methods</h2>
              <div className="h-48">
                {paymentMethodsData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodsData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-sm text-slate-400 gap-2">
                    <span>No payment method data yet.</span>
                    <span className="text-xs text-slate-500">Method split appears once transactions are recorded.</span>
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {paymentMethodsData.map((method) => (
                  <div key={method.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: method.color }} />
                      <span className="text-sm text-slate-400">{method.name}</span>
                    </div>
                    <span className="text-sm font-medium">{method.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="home-surface rounded-2xl border border-slate-700 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Transaction</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Merchant</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length ? (
                    recentTransactions.map((tx) => (
                      <tr key={tx._id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                tx.type === 'card'
                                  ? 'bg-emerald-500/20'
                                  : tx.type === 'crypto'
                                  ? 'bg-blue-500/20'
                                  : 'bg-purple-500/20'
                              }`}
                            >
                              {tx.type === 'card' ? (
                                <CreditCard className="w-5 h-5 text-emerald-400" />
                              ) : tx.type === 'crypto' ? (
                                <Bitcoin className="w-5 h-5 text-blue-400" />
                              ) : (
                                <DollarSign className="w-5 h-5 text-purple-400" />
                              )}
                            </div>
                            <span className="font-medium capitalize">{tx.type} Payment</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{tx.merchantName || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium">{formatAmount(tx)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              tx.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : tx.status === 'pending' || tx.status === 'processing'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : tx.status === 'failed'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="space-y-2">
                          <p>No transactions found for this range.</p>
                          <Link to="/payment" className="text-cyan-200 hover:text-cyan-100 transition-colors">Start a payment test</Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
