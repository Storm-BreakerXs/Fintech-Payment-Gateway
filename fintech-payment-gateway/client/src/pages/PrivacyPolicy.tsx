import { Link } from 'react-router-dom'
import { CalendarDays, FileLock2, Globe2, Mail, Scale, ShieldCheck } from 'lucide-react'
import { visualAssets } from '../content/visualAssets'

interface PolicySection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

const effectiveDate = 'March 6, 2026'

const dataCategories = [
  {
    category: 'Account and Identity Data',
    examples: 'Name, email, phone number, company details, account credentials, verification identifiers.',
    purpose: 'Account creation, authentication, support, fraud prevention, legal compliance.',
  },
  {
    category: 'Payment and Transaction Data',
    examples: 'Transaction amount, currency, status, reference IDs, payer/payee metadata, settlement records.',
    purpose: 'Payment processing, reconciliation, reporting, dispute handling, audit and compliance.',
  },
  {
    category: 'Compliance and Risk Data',
    examples: 'KYC/AML information, sanctions screening outcomes, fraud signals, investigation notes.',
    purpose: 'Legal obligations, anti-fraud controls, regulatory reporting, risk management.',
  },
  {
    category: 'Technical and Usage Data',
    examples: 'IP address, user agent, session events, device metadata, logs, API telemetry.',
    purpose: 'Security monitoring, service reliability, analytics, troubleshooting.',
  },
  {
    category: 'Communications Data',
    examples: 'Support tickets, onboarding forms, contact-sales submissions, emails and chat records.',
    purpose: 'Customer support, sales follow-up, quality assurance, dispute resolution.',
  },
]

const rightsByRegion = [
  {
    region: 'EU/EEA and UK (GDPR/UK GDPR)',
    rights: 'Access, correction, deletion, restriction, objection, portability, and consent withdrawal where applicable.',
  },
  {
    region: 'Nigeria (NDPA 2023)',
    rights: 'Access, rectification, erasure, data portability, objection to processing, and complaint rights.',
  },
  {
    region: 'United States (state privacy laws, where applicable)',
    rights: 'Know/access, correction, deletion, portability, and opt-out rights for certain processing contexts.',
  },
]

const policySections: PolicySection[] = [
  {
    id: 'scope',
    title: '1. Scope and Applicability',
    paragraphs: [
      'This Privacy Policy explains how FinPay Gateway ("FinPay", "we", "our", "us") collects, uses, discloses, stores, and protects personal data when you access our website, APIs, applications, and related payment services.',
      'This policy applies to merchants, business users, developers, prospective customers, and website visitors. Where FinPay acts as a processor on behalf of a merchant customer, that merchant remains the primary controller for end-customer data they submit through our platform.',
    ],
  },
  {
    id: 'controller',
    title: '2. Data Controller Information',
    paragraphs: [
      'For data processing activities where FinPay determines purposes and means, FinPay acts as a data controller. For processing performed solely under merchant instructions, FinPay acts as a data processor/service provider.',
      'Privacy requests can be submitted via privacy@finpay.com.ng. Security incidents can be reported to support@finpay.com.ng.',
    ],
  },
  {
    id: 'collection',
    title: '3. Personal Data We Collect',
    paragraphs: [
      'We collect data directly from you, from your authorized users, from payment counterparties, from integrations, and from service providers that support compliance and fraud monitoring.',
    ],
    bullets: [
      'Account, onboarding, and business profile information.',
      'Transaction, settlement, payout, and reconciliation records.',
      'Regulatory compliance data (KYC/AML and sanctions controls).',
      'Device, network, and session security telemetry.',
      'Customer support, sales, and operational communications.',
    ],
  },
  {
    id: 'legal-basis',
    title: '4. Legal Bases for Processing',
    paragraphs: [
      'Where required by law, FinPay relies on one or more legal bases: performance of a contract, compliance with legal obligations, legitimate interests (for security, fraud prevention, and service operations), and consent where required for specific activities.',
      'If consent is used, you may withdraw consent at any time; withdrawal does not affect processing already lawfully completed.',
    ],
  },
  {
    id: 'use',
    title: '5. How We Use Personal Data',
    paragraphs: [
      'We use personal data to provide and improve payment services, authenticate access, monitor platform integrity, manage financial operations, comply with legal/regulatory requirements, and communicate with users and customers.',
    ],
    bullets: [
      'Operate checkout, payout, treasury, and account services.',
      'Prevent fraud, abuse, unauthorized activity, and policy violations.',
      'Meet legal obligations (e.g., AML/CFT, tax, accounting, and audit duties).',
      'Respond to support requests, disputes, and investigations.',
      'Provide service notifications and business communications.',
    ],
  },
  {
    id: 'sharing',
    title: '6. Data Sharing and Disclosure',
    paragraphs: [
      'We do not sell personal data for money. We share data only when necessary for service delivery, legal compliance, security, and legitimate business operations.',
    ],
    bullets: [
      'Payment processors, banking partners, and network providers.',
      'Identity, sanctions, fraud, and risk-control service providers.',
      'Cloud hosting, analytics, monitoring, and support vendors under contractual safeguards.',
      'Regulators, law enforcement, or courts where legally required.',
      'Advisors and acquirers during mergers, financing, or restructuring, subject to confidentiality controls.',
    ],
  },
  {
    id: 'transfers',
    title: '7. International Data Transfers',
    paragraphs: [
      'Your data may be processed in jurisdictions outside your country. Where required, FinPay applies contractual and organizational safeguards for cross-border transfers, including data protection clauses and risk-based controls.',
      'Transfer safeguards are reviewed periodically and adjusted to reflect legal requirements and regulator guidance.',
    ],
  },
  {
    id: 'retention',
    title: '8. Data Retention',
    paragraphs: [
      'We retain personal data for as long as necessary to provide services, meet legal obligations, resolve disputes, enforce agreements, and maintain security and audit records.',
      'Retention periods vary by data type, contractual obligations, and applicable laws. Data may be retained beyond account closure where legal or regulatory obligations require continued retention.',
    ],
    bullets: [
      'Account and profile records: retained while account is active and for required post-closure compliance periods.',
      'Transaction and financial records: retained according to legal, tax, accounting, AML, and audit requirements.',
      'Security logs and telemetry: retained for incident response, fraud controls, and legal defense needs.',
      'Support and communication records: retained for operational continuity and dispute handling.',
    ],
  },
  {
    id: 'deletion',
    title: '9. Account Deletion Workflow',
    paragraphs: [
      'When a user submits a deletion request and confirms with password plus explicit confirmation text, FinPay schedules deletion with a 24-hour grace period.',
      'At scheduling time, active sessions are revoked and the user is signed out immediately. If the same user signs back in within the 24-hour grace period, the deletion request is canceled automatically.',
      'FinPay sends an email notice when deletion is scheduled and another notice if deletion is canceled. After the grace window expires, data is deleted or anonymized unless retention is required by applicable law or legal hold.',
    ],
  },
  {
    id: 'security',
    title: '10. Security Measures',
    paragraphs: [
      'FinPay applies layered technical and organizational controls, including encryption, secure authentication, role-aware access controls, logging, monitoring, and incident response procedures.',
      'No system is completely risk-free. Users are responsible for maintaining strong credentials, protecting devices, and reporting suspicious activity promptly.',
    ],
  },
  {
    id: 'cookies',
    title: '11. Cookies and Similar Technologies',
    paragraphs: [
      'FinPay uses essential cookies and related technologies to maintain sessions, secure authentication, and support service functionality. Optional analytics technologies may be used to improve performance and user experience where permitted.',
      'Cookie preferences may be managed through browser settings and product controls where available.',
    ],
  },
  {
    id: 'rights',
    title: '12. Your Privacy Rights',
    paragraphs: [
      'Depending on your jurisdiction, you may have rights to access, correct, delete, restrict, object to certain processing, and request portability of your data.',
      'FinPay will verify requestor identity before fulfilling rights requests and may deny or limit requests where permitted by law (for example, where data must be retained for legal compliance).',
    ],
  },
  {
    id: 'children',
    title: '13. Children and Minors',
    paragraphs: [
      'FinPay services are designed for business and professional use and are not directed to children. We do not knowingly collect personal data from children in a manner that violates applicable law.',
      'If you believe a child submitted personal data unlawfully, contact us and we will investigate and take appropriate action.',
    ],
  },
  {
    id: 'changes',
    title: '14. Policy Updates',
    paragraphs: [
      'We may update this policy to reflect legal, technical, operational, or product changes. Material changes will be communicated through appropriate channels, including in-product notices or email where required.',
      `This version is effective ${effectiveDate}.`,
    ],
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-300/35 bg-gradient-to-br from-blue-500/14 via-cyan-500/10 to-slate-900/45 p-6 sm:p-10">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-300/40 bg-blue-400/15 text-blue-100 text-xs uppercase tracking-[0.2em]">
              <FileLock2 className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </div>
            <h1 className="text-3xl sm:text-5xl text-white leading-tight max-w-5xl">
              FinPay Privacy Policy
            </h1>
            <p className="text-slate-200/90 text-base sm:text-lg max-w-4xl">
              This policy governs how FinPay processes personal data across our website, APIs, onboarding, payments,
              compliance workflows, and support operations.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Effective Date</p>
                <p className="text-white font-semibold mt-1 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-200" /> {effectiveDate}</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Controller Contact</p>
                <p className="text-white font-semibold mt-1 flex items-center gap-2"><Mail className="w-4 h-4 text-blue-200" /> privacy@finpay.com.ng</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Security Contact</p>
                <p className="text-white font-semibold mt-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-200" /> support@finpay.com.ng</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-blue-100 uppercase tracking-[0.18em]">Coverage</p>
                <p className="text-white font-semibold mt-1 flex items-center gap-2"><Globe2 className="w-4 h-4 text-blue-200" /> Global Services</p>
              </div>
            </div>
          </div>

          <div className="home-surface rounded-2xl border border-slate-500/30 overflow-hidden">
            <img
              src={visualAssets.policyCompliance.src}
              alt={visualAssets.policyCompliance.alt}
              className="h-full min-h-[270px] w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.15fr,0.85fr] gap-6">
        <article className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
          <h2 className="text-2xl text-white mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-200" />
            Data Categories Overview
          </h2>
          <div className="space-y-4">
            {dataCategories.map((item) => (
              <div key={item.category} className="rounded-2xl border border-slate-500/25 bg-slate-950/35 p-4">
                <p className="text-white font-semibold">{item.category}</p>
                <p className="text-sm text-slate-300 mt-2"><span className="text-blue-100">Examples:</span> {item.examples}</p>
                <p className="text-sm text-slate-300 mt-2"><span className="text-blue-100">Purpose:</span> {item.purpose}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
          <h2 className="text-2xl text-white mb-4">Regional Rights Snapshot</h2>
          <div className="space-y-4">
            {rightsByRegion.map((item) => (
              <div key={item.region} className="rounded-2xl border border-slate-500/25 bg-slate-950/35 p-4">
                <p className="text-white font-semibold">{item.region}</p>
                <p className="text-sm text-slate-300 mt-2">{item.rights}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-5">
            For formal requests, email privacy@finpay.com.ng with sufficient details to verify identity and scope.
          </p>
        </article>
      </section>

      <section className="grid lg:grid-cols-[0.78fr,0.22fr] gap-6">
        <div className="space-y-5">
          {policySections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8 scroll-mt-24"
            >
              <h2 className="text-2xl text-white mb-4">{section.title}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-slate-200 leading-relaxed">{paragraph}</p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {section.bullets.map((item) => (
                    <li key={item} className="text-sm text-slate-200">{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}

          <article className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8">
            <h2 className="text-2xl text-white mb-4">Contact and Complaints</h2>
            <p className="text-slate-200 leading-relaxed">
              Questions or complaints regarding data handling may be sent to privacy@finpay.com.ng.
              You may also contact your local data protection authority where applicable.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="mailto:privacy@finpay.com.ng"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-500/20 border border-blue-300/35 text-blue-100 font-semibold"
              >
                <Mail className="w-4 h-4" />
                Contact Privacy Team
              </a>
              <Link
                to="/terms"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-500/50 bg-slate-900/35 text-slate-100 font-semibold"
              >
                Review Terms
              </Link>
            </div>
          </article>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 home-surface rounded-2xl border border-slate-500/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-blue-100 mb-3">On This Page</p>
            <nav className="space-y-2">
              {policySections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block text-sm text-slate-300 hover:text-white transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </section>
    </div>
  )
}
