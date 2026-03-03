import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle } from 'lucide-react'
import { sitePages } from '../content/sitePages'

export default function SitePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const page = sitePages[slug]

  if (!page) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="glass rounded-2xl border border-slate-700 p-10 text-center">
          <h1 className="text-3xl font-bold mb-3">Page Not Found</h1>
          <p className="text-slate-400 mb-8">
            The page you requested does not exist.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold"
          >
            <span>Go Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8 sm:space-y-10">
      <div className="glass rounded-2xl border border-slate-700 p-6 sm:p-10">
        <p className="text-sm uppercase tracking-wider text-emerald-400 mb-3">{page.section}</p>
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">{page.title}</h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-3xl">{page.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl border border-slate-700 p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-5">Key Points</h2>
          <ul className="space-y-4">
            {page.highlights.map((item) => (
              <li key={item} className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-2xl border border-slate-700 p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-5">Details</h2>
          <div className="space-y-4">
            {page.details.map((paragraph) => (
              <p key={paragraph} className="text-slate-300 leading-relaxed">{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      {page.ctaLabel && page.ctaHref && (
        <div className="glass rounded-2xl border border-slate-700 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Next Step</h3>
            <p className="text-slate-400 text-sm">Continue with the most relevant action from this page.</p>
          </div>
          {page.ctaHref.startsWith('http') ? (
            <a
              href={page.ctaHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold"
            >
              <span>{page.ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <Link
              to={page.ctaHref}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold"
            >
              <span>{page.ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
