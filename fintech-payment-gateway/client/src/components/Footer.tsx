import { Link } from 'react-router-dom'
import { Github, Linkedin, Mail, Shield, Twitter } from 'lucide-react'
import { footerLinkGroups } from '../content/sitePages'

const trustBadges = [
  'Secure payment infrastructure',
  'KYC-aware verification controls',
  'Real-time payment updates',
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-700/70 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/55 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">System Status</p>
            <p className="text-sm text-slate-200 mt-1">All core services are live. Checkout, API, and webhook services are running normally.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/15 px-3 py-1 text-sm text-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <p className="text-xl font-bold gradient-text">FinPay</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Payment Operating System</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              Accept cards and crypto with one secure checkout and clear reporting.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-slate-300">
              {trustBadges.map((badge) => (
                <li key={badge} className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
                  {badge}
                </li>
              ))}
            </ul>

            <div className="flex gap-4 mt-6">
              <a href="https://x.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="https://github.com/Storm-BreakerXs/Fintech-Payment-Gateway" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="mailto:support@finpay.com.ng" className="text-slate-400 hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinkGroups.product.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinkGroups.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinkGroups.resources.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinkGroups.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-slate-400 hover:text-white text-sm transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-700/70 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">© 2026 FinPay Gateway. All rights reserved.</p>
          <p className="text-xs text-slate-500">Secure cross-border payments for modern businesses.</p>
        </div>
      </div>
    </footer>
  )
}
