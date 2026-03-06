import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Search,
  Download,
  CreditCard,
  Bitcoin,
  ExternalLink,
  Loader2,
  DollarSign,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../utils/api'
import { visualAssets } from '../content/visualAssets'

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

function formatAmount(tx: Transaction): string {
  if (tx.currency === 'USD') return `$${tx.amount.toFixed(2)} ${tx.currency}`
  if (tx.currency === 'ETH') return `ETH ${tx.amount.toFixed(4)}`
  if (tx.currency === 'BTC') return `BTC ${tx.amount.toFixed(6)}`
  return `${tx.amount.toFixed(2)} ${tx.currency}`
}

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | TransactionStatus>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTransactions() {
      setIsLoading(true)
      try {
        const data = await apiRequest<HistoryResponse>('/payments/history?page=1&limit=500', {}, true)
        setTransactions(data.transactions || [])
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Could not load transactions.'
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const id = tx._id.toLowerCase()
      const merchant = (tx.merchantName || '').toLowerCase()
      const query = searchQuery.toLowerCase()

      const matchesSearch = merchant.includes(query) || id.includes(query)
      const matchesType = filterType === 'all' || tx.type === filterType
      const matchesStatus = filterStatus === 'all' || tx.status === filterStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [transactions, searchQuery, filterType, filterStatus])

  const exportCsv = () => {
    if (!filteredTransactions.length) {
      toast.error('No transactions to export.')
      return
    }

    const csvRows = [
      'id,type,merchant,date,amount,currency,status,txHash',
      ...filteredTransactions.map((tx) => {
        const merchant = (tx.merchantName || 'N/A').replace(/,/g, ' ')
        const date = new Date(tx.createdAt).toISOString()
        return `${tx._id},${tx.type},${merchant},${date},${tx.amount},${tx.currency},${tx.status},${tx.txHash || ''}`
      }),
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-slate-400">View and manage your live transaction history</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm hover:bg-slate-700 transition-colors mt-4 sm:mt-0"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-700/80 bg-slate-900/60 overflow-hidden">
        <div className="grid lg:grid-cols-[1.15fr,0.85fr]">
          <div className="p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">History and Recovery</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Track failures and retry safely</h2>
            <p className="mt-3 text-sm text-slate-300 max-w-2xl">
              Quickly find completed, pending, or failed payments and take action.
            </p>
            <Link
              to="/payment"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              <span>New Payment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <img
            src={visualAssets.failedRecovery.src}
            alt={visualAssets.failedRecovery.alt}
            className="h-full min-h-[210px] w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      <div className="home-surface rounded-2xl p-4 border border-slate-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by transaction ID or merchant..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | TransactionType)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="card">Card</option>
              <option value="crypto">Crypto</option>
              <option value="bank">Bank</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | TransactionStatus)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="home-surface rounded-2xl border border-slate-700 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 flex items-center justify-center space-x-3 text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading transactions...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">ID</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Merchant</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length ? (
                    filteredTransactions.map((tx, index) => (
                      <motion.tr
                        key={tx._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-sm">{tx._id.slice(-10).toUpperCase()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {tx.type === 'card' ? (
                              <CreditCard className="w-4 h-4 text-emerald-400" />
                            ) : tx.type === 'crypto' ? (
                              <Bitcoin className="w-4 h-4 text-blue-400" />
                            ) : (
                              <DollarSign className="w-4 h-4 text-purple-400" />
                            )}
                            <span className="capitalize">{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{tx.merchantName || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {tx.txHash ? (
                              <a
                                href={`https://etherscan.io/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <span className="text-sm">View</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-slate-500 text-sm">-</span>
                            )}

                            {tx.status === 'failed' && tx.type === 'card' && (
                              <Link
                                to={`/payment?retry=1&amount=${tx.amount}&currency=${tx.currency}`}
                                className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100 text-sm"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Retry</span>
                              </Link>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <div className="space-y-2">
                          <p>No transactions matched your filters.</p>
                          <Link to="/payment" className="text-cyan-200 hover:text-cyan-100 transition-colors">Start a new payment</Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
              <div className="text-sm text-slate-400">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
