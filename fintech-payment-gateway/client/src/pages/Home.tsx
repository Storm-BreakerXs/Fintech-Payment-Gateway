import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Lock,
  Rocket,
  Shield,
  Timer,
  Zap,
} from 'lucide-react'
import { isAuthenticated } from '../utils/auth'
import { visualAssets } from '../content/visualAssets'

interface MetricItem {
  label: string
  value: string
  note: string
}

interface FeatureItem {
  title: string
  description: string
  bullets: string[]
}

interface UseCaseItem {
  title: string
  summary: string
  impact: string
}

const metrics: MetricItem[] = [
  {
    label: 'Uptime Target',
    value: '99.95%',
    note: 'Observed with active monitoring and resilient infrastructure.',
  },
  {
    label: 'Payment Rails',
    value: 'Card + Crypto',
    note: 'Run checkout, settlement, and tracking from one integration.',
  },
  {
    label: 'Go-Live Speed',
    value: '< 2 Weeks',
    note: 'Teams launch faster with hosted checkout and API webhooks.',
  },
  {
    label: 'Regions',
    value: 'Global',
    note: 'Cross-border support with USD, EUR, and GBP card acceptance.',
  },
]

const features: FeatureItem[] = [
  {
    title: 'Checkout That Converts',
    description: 'A smooth payment journey that helps more customers complete checkout.',
    bullets: [
      'Card redirect via Stripe hosted checkout',
      'Crypto payment mode with wallet flow and live status',
      'Focused mobile-first payment experience',
    ],
  },
  {
    title: 'Visibility for Operations',
    description: 'Your teams can see live status, failures, and recovery actions quickly.',
    bullets: [
      'Dashboard with payment method and performance views',
      'Transaction filters by status, type, and merchant',
      'Export-ready records for finance and reconciliation',
    ],
  },
  {
    title: 'Security and Compliance',
    description: 'Trust signals are embedded across every critical surface.',
    bullets: [
      'Advanced fraud and verification controls',
      'Secure encrypted handling of payment data',
      'Clear records for compliance and dispute resolution',
    ],
  },
]

const useCases: UseCaseItem[] = [
  {
    title: 'Marketplaces',
    summary: 'Collect from buyers and settle faster to sellers.',
    impact: 'Reduce payment friction and resolve disputes faster.',
  },
  {
    title: 'Cross-Border Commerce',
    summary: 'Accept cards while supporting crypto settlement paths.',
    impact: 'Expand internationally with a single payment orchestration layer.',
  },
  {
    title: 'Fintech Platforms',
    summary: 'Offer branded checkout and reliable transaction tracking.',
    impact: 'Expand to new markets with confidence and speed.',
  },
]

const integrationLogos = [
  { name: 'Stripe', src: 'https://cdn.simpleicons.org/stripe/ffffff' },
  { name: 'Ethereum', src: 'https://cdn.simpleicons.org/ethereum/ffffff' },
  { name: 'Polygon', src: 'https://cdn.simpleicons.org/polygon/ffffff' },
  { name: 'Coinbase', src: 'https://cdn.simpleicons.org/coinbase/ffffff' },
  { name: 'WalletConnect', src: 'https://cdn.simpleicons.org/walletconnect/ffffff' },
  { name: 'Chainlink', src: 'https://cdn.simpleicons.org/chainlink/ffffff' },
]

const stagger = {
  hidden: { opacity: 0, y: 18 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay },
  }),
}

export default function Home() {
  const authenticated = isAuthenticated()

  return (
    <div className="space-y-24 pb-24">
      <section className="relative overflow-hidden border-b border-slate-700/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.18),transparent_42%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.22),transparent_35%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
            <motion.div initial="hidden" animate="show" variants={stagger} custom={0.05} className="space-y-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-cyan-100">
                <span className="w-2 h-2 rounded-full bg-cyan-300" />
                Fintech Payment Operating System
              </span>

              <h1 className="text-4xl sm:text-6xl leading-tight text-white">
                Build a payment experience users
                {' '}
                <span className="gradient-text">actually trust</span>
                {' '}
                at first click.
              </h1>

              <p className="text-slate-200/90 text-lg max-w-2xl">
                FinPay unifies secure checkout, transaction visibility, and settlement-ready operations.
                Ship a faster payment product without compromising reliability.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to={authenticated ? '/dashboard' : '/auth?mode=register'}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3.5 font-semibold text-slate-950 transition-all hover:shadow-xl hover:shadow-cyan-500/25"
                >
                  <span>{authenticated ? 'Open Dashboard' : 'Start Integration'}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/payment"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-500/60 bg-slate-900/40 px-7 py-3.5 font-semibold text-slate-100 transition-colors hover:bg-slate-800/70"
                >
                  <Rocket className="w-5 h-5" />
                  <span>Try Live Checkout</span>
                </Link>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/55 px-3 py-2">
                  <Lock className="w-4 h-4 text-cyan-300" />
                  Secure redirect checkout
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/55 px-3 py-2">
                  <Zap className="w-4 h-4 text-cyan-300" />
                  Real-time transaction states
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/55 px-3 py-2">
                  <Shield className="w-4 h-4 text-cyan-300" />
                  Compliance-ready controls
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-4"
            >
              <div className="overflow-hidden rounded-3xl border border-slate-600/60 bg-slate-900/60 shadow-2xl">
                <img
                  src={visualAssets.heroCheckout.src}
                  alt={visualAssets.heroCheckout.alt}
                  className="h-[420px] w-full object-cover"
                  loading="eager"
                />
              </div>
              <p className="text-xs text-slate-400">
                Built for modern fintech teams: clear UX, strong trust cues, and reliable payment operations.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.article
              key={metric.label}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={stagger}
              custom={index * 0.06}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
              <p className="mt-3 text-2xl font-bold text-white">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-400">{metric.note}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Trusted Payment Partners</h2>
          <span className="text-sm text-slate-400">Connected with leading payment and digital asset networks</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {integrationLogos.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-4 flex items-center gap-3"
            >
              <img src={item.src} alt={`${item.name} logo`} className="w-5 h-5" loading="lazy" />
              <span className="text-sm text-slate-200">{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 items-stretch">
        <article className="rounded-3xl border border-slate-700/80 bg-slate-900/60 p-7 sm:p-8">
          <h3 className="text-2xl font-bold text-white mb-3">Global Payment Coverage</h3>
          <p className="text-slate-300 mb-6">
            Accept familiar card payments and digital assets in one seamless experience.
          </p>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="inline-flex items-center gap-2"><Globe2 className="w-4 h-4 text-cyan-300" /> Card checkout in USD, EUR, GBP.</p>
            <p className="inline-flex items-center gap-2"><Timer className="w-4 h-4 text-cyan-300" /> Live status tracking and transaction history.</p>
            <p className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-300" /> Fast confirmations and clear customer receipts.</p>
          </div>
          <img
            src={visualAssets.globalNetwork.src}
            alt={visualAssets.globalNetwork.alt}
            className="mt-6 h-56 w-full rounded-2xl object-cover border border-slate-700/70"
            loading="lazy"
          />
        </article>

        <article className="rounded-3xl border border-slate-700/80 bg-slate-900/60 p-7 sm:p-8">
          <h3 className="text-2xl font-bold text-white mb-3">Security and Compliance Confidence</h3>
          <p className="text-slate-300 mb-6">
            Protect every transaction with strong security and compliance-first controls.
          </p>
          <div className="space-y-3 text-sm text-slate-300">
            <p className="inline-flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-300" /> Advanced fraud checks for safer payments.</p>
            <p className="inline-flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-300" /> Encrypted checkout and secure customer data handling.</p>
            <p className="inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-300" /> Transparent records for compliance and support.</p>
          </div>
          <img
            src={visualAssets.securityOps.src}
            alt={visualAssets.securityOps.alt}
            className="mt-6 h-56 w-full rounded-2xl object-cover border border-slate-700/70"
            loading="lazy"
          />
        </article>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr,1fr] gap-8 items-start">
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Businesses Choose FinPay</h2>
          <p className="text-slate-300 max-w-xl">
            Deliver faster checkout, stronger trust, and fewer drop-offs during payment.
          </p>
          <img
            src={visualAssets.merchantVerticals.src}
            alt={visualAssets.merchantVerticals.alt}
            className="h-80 w-full rounded-2xl border border-slate-700/70 object-cover"
            loading="lazy"
          />
        </div>

        <div className="space-y-4">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={stagger}
              custom={index * 0.08}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6"
            >
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-300 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Built for Real Payment Use Cases</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {useCases.map((useCase, index) => (
            <motion.article
              key={useCase.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              variants={stagger}
              custom={index * 0.08}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">{useCase.title}</p>
              <p className="mt-3 text-white font-semibold">{useCase.summary}</p>
              <p className="mt-2 text-sm text-slate-300">{useCase.impact}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-7">
        <article className="rounded-3xl border border-slate-700/80 bg-slate-900/60 overflow-hidden">
          <img
            src={visualAssets.developerApi.src}
            alt={visualAssets.developerApi.alt}
            className="h-64 w-full object-cover"
            loading="lazy"
          />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Fast Setup</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Integrate quickly and go live sooner</h3>
            <p className="mt-2 text-sm text-slate-300">
              Connect your checkout with reliable payment APIs and start accepting payments in minutes.
            </p>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-700/80 bg-slate-900/60 overflow-hidden">
          <img
            src={visualAssets.supportTeam.src}
            alt={visualAssets.supportTeam.alt}
            className="h-64 w-full object-cover"
            loading="lazy"
          />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Support Experience</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Resolve payment issues faster</h3>
            <p className="mt-2 text-sm text-slate-300">
              Track pending and failed payments quickly, export records, and help customers retry with ease.
            </p>
          </div>
        </article>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-cyan-300/30 bg-gradient-to-r from-cyan-400/10 via-blue-500/10 to-emerald-400/10 p-8 sm:p-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to grow with faster payments?</h2>
          <p className="text-slate-200 mt-4 max-w-2xl mx-auto">
            Join businesses using FinPay to accept payments securely, improve completion rates, and scale globally.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/payment"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 font-semibold text-slate-950"
            >
              <span>Start Payment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact-sales"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-500/60 bg-slate-900/40 px-6 py-3 font-semibold text-slate-100"
            >
              <span>Contact Sales</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
