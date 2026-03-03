import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Download, 
  CreditCard, 
  Bitcoin,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

const allTransactions = [
  { id: 'TXN-001', type: 'card', amount: 234.50, currency: 'USD', status: 'completed', date: '2024-01-15 14:30', merchant: 'Tech Store', txHash: '0xabc...123' },
  { id: 'TXN-002', type: 'crypto', amount: 1.5, currency: 'ETH', status: 'completed', date: '2024-01-15 12:15', merchant: 'NFT Marketplace', txHash: '0xdef...456' },
  { id: 'TXN-003', type: 'card', amount: 89.99, currency: 'USD', status: 'pending', date: '2024-01-15 10:45', merchant: 'Coffee Shop', txHash: null },
  { id: 'TXN-004', type: 'crypto', amount: 500, currency: 'USDC', status: 'completed', date: '2024-01-14 18:20', merchant: 'DeFi Protocol', txHash: '0xghi...789' },
  { id: 'TXN-005', type: 'card', amount: 1200, currency: 'USD', status: 'completed', date: '2024-01-14 15:00', merchant: 'Electronics', txHash: null },
  { id: 'TXN-006', type: 'crypto', amount: 0.5, currency: 'BTC', status: 'failed', date: '2024-01-14 11:30', merchant: 'Exchange', txHash: '0xjkl...012' },
  { id: 'TXN-007', type: 'card', amount: 45.67, currency: 'USD', status: 'completed', date: '2024-01-13 20:15', merchant: 'Restaurant', txHash: null },
  { id: 'TXN-008', type: 'crypto', amount: 1000, currency: 'USDT', status: 'completed', date: '2024-01-13 16:45', merchant: 'Staking Pool', txHash: '0xmno...345' },
]

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch = tx.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || tx.type === filterType
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-slate-400">View and manage all your transactions</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm hover:bg-slate-700 transition-colors mt-4 sm:mt-0">
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 border border-slate-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="card">Card</option>
              <option value="crypto">Crypto</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-slate-700 overflow-hidden"
      >
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
              {filteredTransactions.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-sm">{tx.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {tx.type === 'card' ? (
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Bitcoin className="w-4 h-4 text-blue-400" />
                      )}
                      <span className="capitalize">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{tx.merchant}</td>
                  <td className="px-6 py-4 text-slate-400">{tx.date}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium">
                      {tx.currency === 'USD' ? '$' : tx.currency === 'ETH' ? 'Ξ' : tx.currency === 'BTC' ? '₿' : ''}
                      {tx.amount} {tx.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : tx.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {tx.txHash && (
                      <a
                        href={`https://etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <span className="text-sm">View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
          <div className="text-sm text-slate-400">
            Showing {filteredTransactions.length} transactions
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
