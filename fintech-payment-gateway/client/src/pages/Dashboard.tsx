import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard,
  Bitcoin,
  ArrowUpRight,
  ArrowDownRight,
  Download
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
  Cell
} from 'recharts'

const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
  { name: 'Jul', value: 7000 },
]

const paymentMethodsData = [
  { name: 'Card', value: 65, color: '#10b981' },
  { name: 'Crypto', value: 25, color: '#3b82f6' },
  { name: 'Bank', value: 10, color: '#8b5cf6' },
]

const recentTransactions = [
  { id: 1, type: 'card', amount: 234.50, currency: 'USD', status: 'completed', date: '2024-01-15 14:30', merchant: 'Tech Store' },
  { id: 2, type: 'crypto', amount: 1.5, currency: 'ETH', status: 'completed', date: '2024-01-15 12:15', merchant: 'NFT Marketplace' },
  { id: 3, type: 'card', amount: 89.99, currency: 'USD', status: 'pending', date: '2024-01-15 10:45', merchant: 'Coffee Shop' },
  { id: 4, type: 'crypto', amount: 500, currency: 'USDC', status: 'completed', date: '2024-01-14 18:20', merchant: 'DeFi Protocol' },
  { id: 5, type: 'card', amount: 1200, currency: 'USD', status: 'completed', date: '2024-01-14 15:00', merchant: 'Electronics' },
]

const stats = [
  { 
    title: 'Total Revenue', 
    value: '$45,234.56', 
    change: '+12.5%', 
    trend: 'up',
    icon: DollarSign,
    color: 'emerald'
  },
  { 
    title: 'Transactions', 
    value: '1,234', 
    change: '+8.2%', 
    trend: 'up',
    icon: CreditCard,
    color: 'blue'
  },
  { 
    title: 'Crypto Volume', 
    value: 'Ξ45.67', 
    change: '+23.1%', 
    trend: 'up',
    icon: Bitcoin,
    color: 'purple'
  },
  { 
    title: 'Active Users', 
    value: '892', 
    change: '-2.4%', 
    trend: 'down',
    icon: Users,
    color: 'orange'
  },
]

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-slate-400">Overview of your payment activity</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-emerald-500 transition-colors"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.title}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Revenue Overview</h2>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>+23% vs last period</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
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
          </div>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6 border border-slate-700"
        >
          <h2 className="text-lg font-semibold mb-6">Payment Methods</h2>
          <div className="h-48">
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
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {paymentMethodsData.map((method) => (
              <div key={method.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: method.color }}
                  />
                  <span className="text-sm text-slate-400">{method.name}</span>
                </div>
                <span className="text-sm font-medium">{method.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-2xl border border-slate-700 overflow-hidden"
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
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tx.type === 'card' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                      }`}>
                        {tx.type === 'card' ? (
                          <CreditCard className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Bitcoin className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <span className="font-medium capitalize">{tx.type} Payment</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{tx.merchant}</td>
                  <td className="px-6 py-4 text-slate-400">{tx.date}</td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium">
                      {tx.currency === 'USD' ? '$' : tx.currency === 'ETH' ? 'Ξ' : ''}
                      {tx.amount} {tx.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'completed' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
