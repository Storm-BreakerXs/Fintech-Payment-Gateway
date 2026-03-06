export interface SitePageContent {
  slug: string
  section: string
  title: string
  subtitle: string
  highlights: string[]
  details: string[]
  ctaLabel?: string
  ctaHref?: string
}

export const footerLinkGroups = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Security', href: '/security' },
    { label: 'Enterprise', href: '/enterprise' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
  ],
  resources: [
    { label: 'Documentation', href: '/documentation' },
    { label: 'API Reference', href: '/api-reference' },
    { label: 'SDKs', href: '/sdks' },
    { label: 'Status', href: '/status' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
    { label: 'Licenses', href: '/licenses' },
  ],
} as const

export const sitePages: Record<string, SitePageContent> = {
  features: {
    slug: 'features',
    section: 'Product',
    title: 'Platform Features',
    subtitle: 'Everything needed to run card and crypto payments from one gateway.',
    highlights: [
      'Card and crypto acceptance from one checkout experience.',
      'Live transaction status, webhook events, and payment history.',
      'Fraud controls, rate limiting, and auditable logs out of the box.',
      'Merchant dashboard for balances, payouts, and reporting.',
    ],
    details: [
      'FinPay combines checkout, settlement, and risk controls in one platform so your team can move faster.',
      'The platform is built for modern fintech products that need reliable uptime and flexible payment options across regions.',
    ],
    ctaLabel: 'Try The Payment Flow',
    ctaHref: '/payment',
  },
  pricing: {
    slug: 'pricing',
    section: 'Product',
    title: 'Transparent Pricing',
    subtitle: 'Simple pricing tiers for startups, growth teams, and enterprise merchants.',
    highlights: [
      'No setup fee for starter integrations.',
      'Usage-based pricing for transaction volume.',
      'Custom enterprise plans for high-volume merchants.',
      'Dedicated onboarding and support add-ons.',
    ],
    details: [
      'Pricing is designed to scale with your business. Start with standard processing and only pay for advanced modules when you need them.',
      'For custom SLAs and tailored reporting, the enterprise plan includes dedicated support and expert guidance.',
    ],
    ctaLabel: 'Create An Account',
    ctaHref: '/auth?mode=register',
  },
  security: {
    slug: 'security',
    section: 'Product',
    title: 'Security Architecture',
    subtitle: 'Defense-in-depth controls to keep customer data and funds secure.',
    highlights: [
      'Encrypted transport and secure secret management.',
      'Secure sign-in and permission controls for your team.',
      'Rate limiting, request validation, and secure headers by default.',
      'Monitoring-ready logs for incident response and audits.',
    ],
    details: [
      'FinPay applies secure defaults at the API and application layers to reduce common risks such as injection, credential abuse, and replay attempts.',
      'These protections are designed to keep customer trust high without adding checkout friction.',
    ],
    ctaLabel: 'View API Status',
    ctaHref: '/status',
  },
  enterprise: {
    slug: 'enterprise',
    section: 'Product',
    title: 'Enterprise Solutions',
    subtitle: 'Scale globally with tailored controls and dedicated support.',
    highlights: [
      'Role-based access for finance, risk, and support teams.',
      'Dedicated technical account support and onboarding.',
      'Regional deployment and compliance alignment support.',
      'Flexible integration strategy for existing payment stacks.',
    ],
    details: [
      'Enterprise businesses can tailor workflows, reporting, and controls to match their business model.',
      'Dedicated specialists help you launch faster and improve performance over time.',
    ],
    ctaLabel: 'Contact Sales',
    ctaHref: '/contact-sales',
  },
  about: {
    slug: 'about',
    section: 'Company',
    title: 'About FinPay',
    subtitle: 'Building resilient payment infrastructure for global digital commerce.',
    highlights: [
      'Focused on card + crypto payment interoperability.',
      'Built for compliance-sensitive products and markets.',
      'Modern tools and integrations for fast launches.',
      'Reliable infrastructure for mission-critical transactions.',
    ],
    details: [
      'FinPay exists to help businesses accept, route, and monitor payments through one dependable platform.',
      'Our mission is to simplify complex payment stacks so teams can launch faster and serve customers with confidence.',
    ],
    ctaLabel: 'Read Documentation',
    ctaHref: '/documentation',
  },
  blog: {
    slug: 'blog',
    section: 'Company',
    title: 'FinPay Blog',
    subtitle: 'Product updates, customer stories, and payment best practices.',
    highlights: [
      'Guides for smoother payment experiences.',
      'Security and compliance updates.',
      'Release updates and roadmap highlights.',
      'Lessons from real-world payment growth.',
    ],
    details: [
      'Our blog shares practical tips from teams growing with FinPay.',
      'Every post is written to help you improve reliability, conversion, and customer trust.',
    ],
    ctaLabel: 'Start Building',
    ctaHref: '/auth?mode=register',
  },
  careers: {
    slug: 'careers',
    section: 'Company',
    title: 'Careers',
    subtitle: 'Join a team solving hard payment and infrastructure problems.',
    highlights: [
      'Roles across engineering, product, and operations.',
      'Remote-friendly collaboration model.',
      'High-impact work with measurable outcomes.',
      'Strong ownership culture and technical depth.',
    ],
    details: [
      'We are hiring builders who care about reliability, product quality, and customer trust.',
      'If you enjoy shipping meaningful systems and improving core financial experiences, we would like to hear from you.',
    ],
    ctaLabel: 'View Open Roles',
    ctaHref: '/careers',
  },
  press: {
    slug: 'press',
    section: 'Company',
    title: 'Press Room',
    subtitle: 'Company announcements, product launches, and media resources.',
    highlights: [
      'Official product and company announcements.',
      'Brand assets and approved media descriptions.',
      'Recent milestones and ecosystem partnerships.',
      'Media contact pathway for interviews and questions.',
    ],
    details: [
      'This page provides a single source of truth for recent announcements and company background.',
      'For media requests, include publication details and timelines so we can route your request quickly.',
    ],
    ctaLabel: 'Contact Sales',
    ctaHref: '/contact-sales',
  },
  documentation: {
    slug: 'documentation',
    section: 'Resources',
    title: 'Documentation',
    subtitle: 'Integration guides for authentication, payments, and webhooks.',
    highlights: [
      'Quickstart for local and hosted environments.',
      'Endpoint guides with request and response patterns.',
      'Webhook handling and verification examples.',
      'Deployment and operational best practices.',
    ],
    details: [
      'The docs help your team move from first API call to live payments with clear steps.',
      'Reference sections include guidance for error handling, retries, and reliable integrations.',
    ],
    ctaLabel: 'API Reference',
    ctaHref: '/api-reference',
  },
  'api-reference': {
    slug: 'api-reference',
    section: 'Resources',
    title: 'API Reference',
    subtitle: 'Endpoint reference for auth, payment processing, and transaction management.',
    highlights: [
      'Authentication endpoints for registration and login.',
      'Card and crypto payment initiation routes.',
      'Transaction history and status retrieval endpoints.',
      'Webhook endpoints for async payment updates.',
    ],
    details: [
      'Use the API reference for exact route shapes and expected payload structures.',
      'For live usage, combine endpoint integration with idempotency and retry-safe client behavior.',
    ],
    ctaLabel: 'Open Payment Page',
    ctaHref: '/payment',
  },
  sdks: {
    slug: 'sdks',
    section: 'Resources',
    title: 'SDKs',
    subtitle: 'Client SDK support for common backend and frontend stacks.',
    highlights: [
      'REST API integration works today in any language.',
      'TypeScript-first patterns available in this repository.',
      'Helper SDKs for server-side integrations are on the roadmap.',
      'Webhook utility helpers for robust event handling.',
    ],
    details: [
      'Current API endpoints are stable and can be integrated directly with standard HTTP clients.',
      'If you need starter wrappers, your team can build typed clients quickly from the documented contracts.',
    ],
    ctaLabel: 'Read Documentation',
    ctaHref: '/documentation',
  },
  status: {
    slug: 'status',
    section: 'Resources',
    title: 'System Status',
    subtitle: 'Live availability and performance for core FinPay services.',
    highlights: [
      'API health status for backend services.',
      'Database and cache connectivity status.',
      'Checkout and payment processing health.',
      'Incident reporting and recovery updates.',
    ],
    details: [
      'Use the health endpoint for quick checks, or contact support for help.',
      'Monitor latency and error rates to stay ahead of potential issues.',
    ],
    ctaLabel: 'Health Endpoint',
    ctaHref: 'https://api.finpay.com.ng/health',
  },
  privacy: {
    slug: 'privacy',
    section: 'Legal',
    title: 'Privacy Policy',
    subtitle: 'How FinPay handles personal and transaction-related data.',
    highlights: [
      'Collected data is limited to what is required for service operation.',
      'Access controls and encryption protect stored information.',
      'Retention windows align with service and legal requirements.',
      'Users can request data updates through support channels.',
    ],
    details: [
      'FinPay is designed to process sensitive information responsibly and with clear access boundaries.',
      'For questions about data use, contact support for guidance.',
    ],
    ctaLabel: 'Terms Of Service',
    ctaHref: '/terms',
  },
  terms: {
    slug: 'terms',
    section: 'Legal',
    title: 'Terms Of Service',
    subtitle: 'Service usage terms, responsibilities, and operating boundaries.',
    highlights: [
      'Defines acceptable use and account responsibilities.',
      'Clarifies service availability and support scope.',
      'Describes billing and dispute handling basics.',
      'Outlines liability boundaries and legal obligations.',
    ],
    details: [
      'These terms explain how to use the platform and your account responsibilities.',
      'For enterprise agreements, our team can discuss custom terms.',
    ],
    ctaLabel: 'Privacy Policy',
    ctaHref: '/privacy',
  },
  'cookie-policy': {
    slug: 'cookie-policy',
    section: 'Legal',
    title: 'Cookie Policy',
    subtitle: 'Cookie usage categories and user preference management.',
    highlights: [
      'Essential cookies support core authentication and session behavior.',
      'Analytics cookies help improve product performance and UX.',
      'Preference cookies store language and interface selections.',
      'Users can manage non-essential cookie preferences.',
    ],
    details: [
      'Cookie usage is kept purposeful and limited to business and product requirements.',
      'You can adjust cookie preferences based on your region and privacy choices.',
    ],
    ctaLabel: 'Licensing Details',
    ctaHref: '/licenses',
  },
  licenses: {
    slug: 'licenses',
    section: 'Legal',
    title: 'Licenses',
    subtitle: 'Open-source and third-party package license disclosures.',
    highlights: [
      'Frontend and backend dependencies include OSS licenses.',
      'Review third-party licenses for your compliance needs.',
      'Third-party payment providers have separate service terms.',
      'License updates are published as dependencies change.',
    ],
    details: [
      'This platform uses open-source libraries across runtime, UI, and data layers.',
      'You can review dependencies regularly as part of your compliance process.',
    ],
    ctaLabel: 'Back To Home',
    ctaHref: '/',
  },
}
