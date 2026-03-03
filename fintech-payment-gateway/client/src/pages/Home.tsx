import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  ArrowRight,
  CreditCard,
  Bitcoin,
  CheckCircle
} from 'lucide-react'
import Card3D from '../components/Card3D'

const features = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: '256-bit encryption, multi-sig wallets, and real-time fraud detection.',
  },
  {
    icon: Zap,
    title: 'Instant Settlement',
    description: 'Payments settle in seconds, not days. 24/7 availability.',
  },
  {
    icon: Globe,
    title: 'Global Coverage',
    description: 'Accept payments from 190+ countries in 135+ currencies.',
  },
  {
    icon: Lock,
    title: 'Compliance Ready',
    description: 'Built-in KYC/AML, PCI DSS compliance, and audit trails.',
  },
]

const stats = [
  { value: '$2.5B+', label: 'Volume Processed' },
  { value: '50K+', label: 'Active Merchants' },
  { value: '99.99%', label: 'Uptime' },
  { value: '<0.5%', label: 'Fraud Rate' },
]

export default function Home() {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-emerald-400 font-medium">Now supporting Layer 2 networks</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                The Future of{' '}
                <span className="gradient-text">Payments</span>
                {' '}is Here
              </h1>

              <p className="text-xl text-slate-400 max-w-lg">
                Accept fiat and crypto payments with a single integration. 
                Enterprise-grade security with Web3 flexibility.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/payment"
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift"
                >
                  <span>Start Accepting Payments</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:bg-slate-700 transition-all"
                >
                  <span>View Dashboard</span>
                </Link>
              </div>

              <div className="flex items-center space-x-6 text-sm text-slate-500">
                <span className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>No setup fees</span>
                </span>
                <span className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Instant activation</span>
                </span>
                <span className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>24/7 support</span>
                </span>
              </div>
            </motion.div>

            {/* Right content - 3D Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <Card3D 
                  cardNumber="4532 1234 5678 9012"
                  cardHolder="JOHN DOE"
                  expiryDate="12/28"
                />
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-8 -right-8 glass rounded-2xl p-4 border border-emerald-500/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Bitcoin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Crypto Payment</div>
                    <div className="text-lg font-bold text-emerald-400">+ $1,234.56</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-8 -left-8 glass rounded-2xl p-4 border border-blue-500/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Card Payment</div>
                    <div className="text-lg font-bold text-blue-400">+ $567.89</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
              <div className="text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose FinPay?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need to accept payments globally, with the security and compliance enterprises demand.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="glass rounded-2xl p-6 border border-slate-700 hover:border-emerald-500/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 p-12 text-center"
        >
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-8">
              Join thousands of businesses already using FinPay to power their payments.
              Start accepting payments in minutes.
            </p>
            <Link
              to="/payment"
              className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
