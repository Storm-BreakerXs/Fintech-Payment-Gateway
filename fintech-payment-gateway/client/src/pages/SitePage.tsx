import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, CheckCircle, Globe, Shield, Zap } from 'lucide-react'
import { footerLinkGroups, sitePages, type SitePageContent } from '../content/sitePages'
import { visualAssets } from '../content/visualAssets'

const slugAliases: Record<string, string> = {
  products: 'features',
  solutions: 'enterprise',
  developers: 'documentation',
  'developer-hub': 'documentation',
  newsroom: 'press',
  contact: 'about',
  'contact-sales': 'about',
  support: 'status',
  'help-center': 'documentation',
}

const sectionStyles: Record<string, { bg: string; border: string; badge: string }> = {
  Product: {
    bg: 'bg-gradient-to-br from-cyan-500/12 via-blue-500/8 to-emerald-500/10',
    border: 'border-cyan-300/35',
    badge: 'bg-cyan-400/15 text-cyan-100 border-cyan-300/35',
  },
  Company: {
    bg: 'bg-gradient-to-br from-blue-500/12 via-slate-700/20 to-indigo-500/12',
    border: 'border-blue-300/35',
    badge: 'bg-blue-400/15 text-blue-100 border-blue-300/35',
  },
  Resources: {
    bg: 'bg-gradient-to-br from-emerald-500/12 via-cyan-500/10 to-blue-500/10',
    border: 'border-emerald-300/35',
    badge: 'bg-emerald-400/15 text-emerald-100 border-emerald-300/35',
  },
  Legal: {
    bg: 'bg-gradient-to-br from-amber-500/12 via-slate-700/20 to-orange-500/12',
    border: 'border-amber-300/35',
    badge: 'bg-amber-400/15 text-amber-100 border-amber-300/35',
  },
  Default: {
    bg: 'bg-gradient-to-br from-slate-700/35 to-slate-900/35',
    border: 'border-slate-500/30',
    badge: 'bg-slate-700/40 text-slate-100 border-slate-500/40',
  },
}

const sectionVisuals: Record<string, { src: string; alt: string }> = {
  Product: visualAssets.siteProductBrief,
  Company: visualAssets.siteCompanyBrief,
  Resources: visualAssets.siteResourcesBrief,
  Legal: visualAssets.siteLegalBrief,
}

function humanizeSlug(slug: string): string {
  return slug
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function isExternalUrl(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

function buildFallbackPage(slug: string, pathname: string): SitePageContent {
  const title = humanizeSlug(slug)
  return {
    slug,
    section: 'Resources',
    title,
    subtitle: 'This page is live and ready with helpful information.',
    highlights: [
      `You are viewing ${title} on FinPay.`,
      'Explore product, company, resources, and legal pages from one place.',
      'Use the navigation below to discover related topics.',
      'Contact our team if you need help finding the right solution.',
    ],
    details: [
      'This page is part of the FinPay website and can be updated with new content anytime.',
      `Current path: ${pathname}`,
    ],
    ctaLabel: 'Go To Home',
    ctaHref: '/',
  }
}

function getSectionLinks(section: string): ReadonlyArray<{ label: string; href: string }> {
  const map: Record<string, ReadonlyArray<{ label: string; href: string }>> = {
    Product: footerLinkGroups.product,
    Company: footerLinkGroups.company,
    Resources: footerLinkGroups.resources,
    Legal: footerLinkGroups.legal,
  }
  return map[section] || footerLinkGroups.resources
}

export default function SitePage() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)
  const rawSlug = decodeURIComponent(segments[segments.length - 1] || 'features').toLowerCase()
  const resolvedSlug = slugAliases[rawSlug] || rawSlug
  const page = sitePages[resolvedSlug] || buildFallbackPage(resolvedSlug, pathname)
  const sectionTheme = sectionStyles[page.section] || sectionStyles.Default
  const sectionLinks = getSectionLinks(page.section)
  const sectionVisual = sectionVisuals[page.section] || visualAssets.siteResourcesBrief
  const relatedPages = Object.values(sitePages)
    .filter((item) => item.section === page.section && item.slug !== page.slug)
    .slice(0, 4)

  const ctaLabel = page.ctaLabel || 'Get Started'
  const ctaHref = page.ctaHref || '/auth?mode=register'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-7 sm:space-y-9">
      <section className={`relative overflow-hidden rounded-3xl border ${sectionTheme.border} ${sectionTheme.bg} p-6 sm:p-10`}>
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-8 items-start">
          <div className="space-y-6">
            <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${sectionTheme.badge}`}>
              <Shield className="w-3.5 h-3.5" />
              <span>{page.section}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl text-white leading-tight">{page.title}</h1>
            <p className="text-slate-200/90 text-base sm:text-lg max-w-3xl">{page.subtitle}</p>

            <div className="flex flex-wrap gap-3">
              {isExternalUrl(ctaHref) ? (
                <a
                  href={ctaHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  to={ctaHref}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
                >
                  <span>{ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link
                to="/payment"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-500/50 bg-slate-900/35 text-slate-100 font-semibold hover:bg-slate-800/50 transition-all"
              >
                <span>Open Payment Demo</span>
              </Link>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="home-surface rounded-2xl border border-slate-500/30 overflow-hidden sm:col-span-2">
              <img
                src={sectionVisual.src}
                alt={sectionVisual.alt}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="home-surface rounded-2xl border border-slate-500/30 p-4">
              <p className="text-xs text-cyan-100 uppercase tracking-[0.2em] mb-2">Highlights</p>
              <p className="text-3xl text-white font-bold">{page.highlights.length}</p>
              <p className="text-sm text-slate-300 mt-2">Key points on this page.</p>
            </div>
            <div className="home-surface rounded-2xl border border-slate-500/30 p-4">
              <p className="text-xs text-emerald-100 uppercase tracking-[0.2em] mb-2">Depth</p>
              <p className="text-3xl text-white font-bold">{page.details.length}</p>
              <p className="text-sm text-slate-300 mt-2">Helpful details and guidance.</p>
            </div>
            <div className="home-surface rounded-2xl border border-slate-500/30 p-4 sm:col-span-2">
              <p className="text-xs text-amber-100 uppercase tracking-[0.2em] mb-2">Route</p>
              <p className="text-white text-sm break-all">{pathname}</p>
              <p className="text-xs text-slate-400 mt-2">Use this URL to return to this page anytime.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.05fr,0.95fr] gap-6">
        <div className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
          <h2 className="text-2xl text-white mb-5">What This Page Covers</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {page.highlights.map((item, index) => (
              <article key={item} className="rounded-2xl border border-slate-500/25 bg-slate-950/35 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-cyan-400/20 text-cyan-100 text-xs font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
          <h2 className="text-2xl text-white mb-5">More Details</h2>
          <div className="space-y-4">
            {page.details.map((paragraph) => (
              <div key={paragraph} className="rounded-2xl border border-slate-500/25 bg-slate-950/35 p-4">
                <p className="text-slate-200 leading-relaxed">{paragraph}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[0.85fr,1.15fr] gap-6">
        <div className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
          <h2 className="text-xl text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-200" />
            Quick Navigation
          </h2>
          <ul className="space-y-3">
            {sectionLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="inline-flex items-center gap-2 text-slate-200 hover:text-cyan-100 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
          <h2 className="text-xl text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-200" />
            Related {page.section} Pages
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {relatedPages.length > 0 ? (
              relatedPages.map((item) => (
                <Link
                  key={item.slug}
                  to={`/${item.slug}`}
                  className="rounded-2xl border border-slate-500/25 bg-slate-950/35 p-4 hover:border-cyan-300/35 transition-colors"
                >
                  <p className="text-white font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-300 mt-2">{item.subtitle}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-cyan-100 mt-3">
                    Open page
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))
            ) : (
              <div className="sm:col-span-2 rounded-2xl border border-slate-500/25 bg-slate-950/35 p-4 text-slate-300">
                More pages in this section will appear here soon.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
