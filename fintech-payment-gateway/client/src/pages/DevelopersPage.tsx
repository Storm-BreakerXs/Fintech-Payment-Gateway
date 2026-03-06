import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Code2, Cpu, FileJson2, Webhook } from 'lucide-react'

const snippets = `POST /api/payments/card/checkout
{
  "amount": 1250,
  "currency": "USD",
  "merchantName": "Acme Store"
}`

const tracks = [
  {
    title: 'Integration Track',
    icon: Code2,
    details: 'Authentication, payment initiation, and webhook verification with production-safe patterns.',
    href: '/documentation',
  },
  {
    title: 'API Reference',
    icon: FileJson2,
    details: 'Endpoint contracts for auth, payments, crypto, and transaction history.',
    href: '/api-reference',
  },
  {
    title: 'Event Workflows',
    icon: Webhook,
    details: 'Webhook-first architecture for reconciliation, retries, and status transitions.',
    href: '/status',
  },
]

export default function DevelopersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-300/35 bg-gradient-to-br from-emerald-500/13 via-cyan-500/10 to-slate-900/45 p-6 sm:p-10">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-8 items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-300/40 bg-emerald-400/15 text-emerald-100 text-xs uppercase tracking-[0.2em]">
              <Cpu className="w-3.5 h-3.5" />
              <span>Developers</span>
            </div>
            <h1 className="text-3xl sm:text-5xl text-white leading-tight">
              Developer flows designed for fast production rollouts.
            </h1>
            <p className="text-slate-200/90 text-base sm:text-lg max-w-3xl">
              Build with typed routes, webhook-led event handling, and modular integration steps that match real payment
              operations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/documentation"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-300 text-slate-950 font-semibold"
              >
                <span>Read Docs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact-sales"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-500/50 bg-slate-900/35 text-slate-100 font-semibold"
              >
                <span>Request Technical Call</span>
              </Link>
            </div>
          </div>

          <div className="home-surface rounded-2xl border border-slate-500/30 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-2">Quickstart Sample</p>
            <pre className="text-xs sm:text-sm text-cyan-100 bg-slate-950/70 border border-slate-500/30 rounded-xl p-4 overflow-x-auto">
{snippets}
            </pre>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        {tracks.map((track) => {
          const Icon = track.icon
          return (
            <article key={track.title} className="home-surface rounded-3xl border border-slate-500/30 p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-400/15 border border-emerald-300/35 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-emerald-100" />
              </div>
              <h2 className="text-xl text-white mb-3">{track.title}</h2>
              <p className="text-slate-300 text-sm mb-4">{track.details}</p>
              <Link to={track.href} className="inline-flex items-center gap-1 text-emerald-100 hover:text-white">
                <span>Open</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          )
        })}
      </section>

      <section className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
        <h2 className="text-2xl text-white mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-100" />
          Production Checklist
        </h2>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-slate-200">
          <li>Validate idempotency and retry behavior for payment creation calls.</li>
          <li>Verify webhook signatures and enforce replay-protection policies.</li>
          <li>Map transaction states to your internal operations dashboard.</li>
          <li>Define alerting for failed payments, queue lag, and provider errors.</li>
        </ul>
      </section>
    </div>
  )
}
