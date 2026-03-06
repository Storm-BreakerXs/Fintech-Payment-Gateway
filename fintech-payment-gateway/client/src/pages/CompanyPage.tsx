import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, Globe2, Newspaper, ShieldCheck } from 'lucide-react'
import { visualAssets } from '../content/visualAssets'

const values = [
  {
    title: 'Clarity for Teams',
    description: 'We design payment experiences that finance, compliance, and support teams can run with confidence.',
    icon: Globe2,
  },
  {
    title: 'Trust by Default',
    description: 'Every product decision is built to protect customer trust, control, and resilience.',
    icon: ShieldCheck,
  },
  {
    title: 'Fast Execution',
    description: 'We focus on clear ownership and measurable results so teams can launch quickly.',
    icon: Briefcase,
  },
]

const milestones = [
  'Card and crypto checkout launched',
  'Cross-border payouts and treasury tools expanded',
  'Developer docs and webhook workflows released',
  'Enterprise support across key corridors',
]

export default function CompanyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-300/35 bg-gradient-to-br from-blue-500/14 via-indigo-500/10 to-slate-900/45 p-6 sm:p-10">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-8 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-300/40 bg-blue-400/15 text-blue-100 text-xs uppercase tracking-[0.2em]">
              <Newspaper className="w-3.5 h-3.5" />
              <span>Company</span>
            </div>
            <h1 className="text-3xl sm:text-5xl text-white leading-tight max-w-4xl">
              Building practical payment infrastructure for global operators.
            </h1>
            <p className="text-slate-200/90 text-base sm:text-lg max-w-3xl">
              FinPay focuses on real operating outcomes: faster settlement, lower friction, and stronger visibility across
              collections, treasury, and payouts.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Focus</p>
                <p className="text-white font-semibold mt-1">Global payments</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Priority</p>
                <p className="text-white font-semibold mt-1">Customer trust</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Approach</p>
                <p className="text-white font-semibold mt-1">Reliable execution</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact-sales"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-300 to-cyan-300 text-slate-950 font-semibold"
              >
                <span>Talk to Us</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/careers"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-500/50 bg-slate-900/35 text-slate-100 font-semibold"
              >
                <span>See Careers</span>
              </Link>
            </div>
          </div>

          <div className="home-surface rounded-2xl border border-slate-500/30 overflow-hidden">
            <img
              src={visualAssets.crossBorderTeam.src}
              alt={visualAssets.crossBorderTeam.alt}
              className="h-full min-h-[280px] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        {values.map((value) => {
          const Icon = value.icon
          return (
            <article key={value.title} className="home-surface rounded-3xl border border-slate-500/30 p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-400/15 border border-blue-300/35 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-100" />
              </div>
              <h2 className="text-xl text-white mb-3">{value.title}</h2>
              <p className="text-slate-300 text-sm">{value.description}</p>
            </article>
          )
        })}
      </section>

      <section className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
        <h2 className="text-2xl text-white mb-4">Milestones</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {milestones.map((milestone, index) => (
            <div key={milestone} className="rounded-2xl border border-slate-500/25 bg-slate-950/35 p-4">
              <p className="text-xs text-blue-100 uppercase tracking-[0.18em] mb-2">Phase {index + 1}</p>
              <p className="text-slate-200">{milestone}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
