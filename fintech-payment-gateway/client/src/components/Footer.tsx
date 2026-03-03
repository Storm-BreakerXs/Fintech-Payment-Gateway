import { Link } from 'react-router-dom'
import { Shield, Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { footerLinkGroups } from '../content/sitePages'

export default function Footer() {
  return (
    <footer className="bg-slate-900/50 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">FinPay</span>
            </div>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Next-generation payment gateway with crypto integration. Secure,
              fast, and compliant.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/Storm-BreakerXs/Fintech-Payment-Gateway"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@finpay.gateway"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinkGroups.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinkGroups.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinkGroups.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinkGroups.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between">
          <p className="text-slate-500 text-sm">
            © 2026 FinPay Gateway. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="flex items-center space-x-2 text-slate-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All systems operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
