import { Link } from 'react-router-dom'
import { ArrowRight, Blocks, CreditCard, Repeat, WalletCards, Zap } from 'lucide-react'
import { visualAssets } from '../content/visualAssets'

const products = [
  {
    title: 'Global Checkout',
    icon: CreditCard,
    description: 'One checkout for card, transfer, and digital assets with conversion-optimized routing.',
    bullets: ['Embedded + hosted modes', 'Retry-safe transaction orchestration', 'Approval-rate optimization controls'],
    href: '/payment',
  },
  {
    title: 'Treasury Hub',
    icon: WalletCards,
    description: 'Unify fiat and stablecoin balances with policy-driven conversion and settlement.',
    bullets: ['Multi-currency balance views', 'Conversion policy controls', 'Corridor-level treasury rules'],
    href: '/features',
  },
  {
    title: 'Payout Engine',
    icon: Repeat,
    description: 'Mass payouts and collections in one system with full visibility for your team.',
    bullets: ['Batch and scheduled payouts', 'Webhook-first event updates', 'Automated retry and status handling'],
    href: '/enterprise',
  },
  {
    title: 'On/Off Ramp APIs',
    icon: Zap,
    description: 'Move users between local rails and digital assets without leaving your product.',
    bullets: ['Compliance-aware flows', 'Liquidity routing support', 'Clear API contracts and guides'],
    href: '/documentation',
  },
]

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-300/35 bg-gradient-to-br from-cyan-500/15 via-blue-500/8 to-slate-900/45 p-6 sm:p-10">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-8 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-300/40 bg-cyan-400/15 text-cyan-100 text-xs uppercase tracking-[0.2em]">
              <Blocks className="w-3.5 h-3.5" />
              <span>Products</span>
            </div>
            <h1 className="text-3xl sm:text-5xl text-white leading-tight max-w-4xl">
              Everything you need to accept and manage payments in one place.
            </h1>
            <p className="text-slate-200/90 text-base sm:text-lg max-w-3xl">
              FinPay products are modular, but they operate as one platform. Start with checkout and expand into
              treasury, payouts, and on/off-ramp as your business grows.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-cyan-100 uppercase tracking-[0.18em]">Checkout</p>
                <p className="text-white font-semibold mt-1">Card + Crypto</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-cyan-100 uppercase tracking-[0.18em]">Treasury</p>
                <p className="text-white font-semibold mt-1">Multi-currency</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-cyan-100 uppercase tracking-[0.18em]">Payouts</p>
                <p className="text-white font-semibold mt-1">Fast + Reliable</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact-sales"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold"
              >
                <span>Contact Sales</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/payment"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-500/50 bg-slate-900/35 text-slate-100 font-semibold"
              >
                <span>Open Product Demo</span>
              </Link>
            </div>
          </div>

          <div className="home-surface rounded-2xl border border-slate-500/30 overflow-hidden">
            <img
              src={visualAssets.enterpriseMeeting.src}
              alt={visualAssets.enterpriseMeeting.alt}
              className="h-full min-h-[260px] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-5">
        {products.map((product) => {
          const Icon = product.icon
          return (
            <article key={product.title} className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-7">
              <div className="w-12 h-12 rounded-xl bg-cyan-400/15 border border-cyan-300/35 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-cyan-200" />
              </div>
              <h2 className="text-2xl text-white mb-3">{product.title}</h2>
              <p className="text-slate-300 mb-5">{product.description}</p>
              <ul className="space-y-2 mb-5">
                {product.bullets.map((bullet) => (
                  <li key={bullet} className="text-sm text-slate-200">{bullet}</li>
                ))}
              </ul>
              <Link to={product.href} className="inline-flex items-center gap-1 text-cyan-100 hover:text-white">
                <span>Open</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          )
        })}
      </section>
    </div>
  )
}
