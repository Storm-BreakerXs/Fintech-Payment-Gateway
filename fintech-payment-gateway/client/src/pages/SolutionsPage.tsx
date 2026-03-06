import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Landmark, ShoppingBag, Users2 } from 'lucide-react'

const solutionTracks = [
  {
    title: 'Digital Banks & Wallets',
    icon: Landmark,
    outcome: 'Launch new corridors without rebuilding payment infrastructure.',
    steps: ['Localized collections', 'Real-time settlement visibility', 'Compliance workflow support'],
  },
  {
    title: 'Remittance & Payroll',
    icon: Users2,
    outcome: 'Lower payout friction while improving speed and delivery transparency.',
    steps: ['Bulk payout orchestration', 'Retry and status automation', 'Corridor-level reporting'],
  },
  {
    title: 'Marketplaces & Commerce',
    icon: ShoppingBag,
    outcome: 'Unify collections and merchant payouts in one controlled system.',
    steps: ['Split settlement paths', 'Seller payout controls', 'Revenue reconciliation views'],
  },
]

export default function SolutionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-amber-300/35 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-900/45 p-6 sm:p-10">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-300/40 bg-amber-400/15 text-amber-100 text-xs uppercase tracking-[0.2em]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Solutions</span>
            </div>
            <h1 className="text-3xl sm:text-5xl text-white leading-tight">
              Industry solution blueprints for cross-border payment growth.
            </h1>
            <p className="text-slate-200/90 text-base sm:text-lg max-w-3xl">
              We map your use case, volume, corridors, and compliance profile into a rollout plan that engineering and
              operations teams can execute without ambiguity.
            </p>
            <Link
              to="/contact-sales"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 text-slate-950 font-semibold"
            >
              <span>Book Solution Call</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="home-surface rounded-2xl border border-slate-500/30 p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100">Engagement Path</p>
            <div className="rounded-xl border border-slate-500/25 bg-slate-950/35 p-4 text-sm text-slate-200">1. Discovery: volume, markets, risk profile</div>
            <div className="rounded-xl border border-slate-500/25 bg-slate-950/35 p-4 text-sm text-slate-200">2. Solution Design: rails, routing, compliance controls</div>
            <div className="rounded-xl border border-slate-500/25 bg-slate-950/35 p-4 text-sm text-slate-200">3. Go-Live Plan: integration milestones + ownership map</div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        {solutionTracks.map((track) => {
          const Icon = track.icon
          return (
            <article key={track.title} className="home-surface rounded-3xl border border-slate-500/30 p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-400/15 border border-amber-300/35 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-amber-100" />
              </div>
              <h2 className="text-xl text-white mb-3">{track.title}</h2>
              <p className="text-slate-200 text-sm mb-4">{track.outcome}</p>
              <ul className="space-y-2">
                {track.steps.map((step) => (
                  <li key={step} className="text-sm text-slate-300">{step}</li>
                ))}
              </ul>
            </article>
          )
        })}
      </section>
    </div>
  )
}
