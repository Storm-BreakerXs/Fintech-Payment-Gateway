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
      'Merchant dashboard for operations and reporting.',
    ],
    details: [
      'FinPay combines settlement, compliance signals, and developer tooling into a single platform so teams can move fast without sacrificing controls.',
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
      'For custom SLAs and tailored reporting, the enterprise plan includes dedicated support and architecture guidance.',
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
      'JWT authentication with role-based authorization patterns.',
      'Rate limiting, request validation, and secure headers by default.',
      'Monitoring-ready logs for incident response and audits.',
    ],
    details: [
      'FinPay applies secure defaults at the API and application layers to reduce common risks such as injection, credential abuse, and replay attempts.',
      'Security controls are designed to meet practical fintech needs while keeping integration effort low for engineering teams.',
    ],
    ctaLabel: 'View API Status',
    ctaHref: '/status',
  },
  enterprise: {
    slug: 'enterprise',
    section: 'Product',
    title: 'Enterprise Solutions',
    subtitle: 'Scale globally with custom controls, governance, and support.',
    highlights: [
      'Multi-team access patterns and operational governance.',
      'Dedicated technical account support and onboarding.',
      'Regional deployment and compliance alignment support.',
      'Flexible integration strategy for existing payment stacks.',
    ],
    details: [
      'Enterprise merchants often need deeply integrated workflows, reporting, and controls. FinPay can be configured to match those operational requirements.',
      'Teams can work with dedicated specialists to accelerate production readiness and ongoing optimization.',
    ],
    ctaLabel: 'Contact Sales',
    ctaHref: '/about',
  },
  about: {
    slug: 'about',
    section: 'Company',
    title: 'About FinPay',
    subtitle: 'Building resilient payment infrastructure for global digital commerce.',
    highlights: [
      'Focused on card + crypto payment interoperability.',
      'Built for compliance-sensitive products and markets.',
      'Developer-first tooling and modern integration patterns.',
      'Reliable infrastructure for mission-critical transactions.',
    ],
    details: [
      'FinPay exists to help businesses accept, route, and monitor payments through one dependable platform.',
      'Our mission is to simplify complex payment stacks so product teams can ship faster and operate with confidence.',
    ],
    ctaLabel: 'Read Documentation',
    ctaHref: '/documentation',
  },
  blog: {
    slug: 'blog',
    section: 'Company',
    title: 'Engineering Blog',
    subtitle: 'Product updates, architecture notes, and payment operations best practices.',
    highlights: [
      'Guides for payment integration and reliability.',
      'Security and compliance implementation notes.',
      'Release updates and roadmap highlights.',
      'Operational lessons from production payment systems.',
    ],
    details: [
      'Our blog shares practical insights from building and running fintech infrastructure in production.',
      'Content focuses on real implementation details rather than high-level marketing summaries.',
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
    ctaLabel: 'About FinPay',
    ctaHref: '/about',
  },
  documentation: {
    slug: 'documentation',
    section: 'Resources',
    title: 'Developer Documentation',
    subtitle: 'Integration guides for authentication, payments, and webhooks.',
    highlights: [
      'Quickstart for local and hosted environments.',
      'Endpoint guides with request and response patterns.',
      'Webhook handling and verification examples.',
      'Deployment and operational best practices.',
    ],
    details: [
      'The docs are structured to help teams move from local development to production deployment with clear milestones.',
      'Reference sections include practical guidance for error handling, retries, and resilient client integrations.',
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
      'For production use, pair endpoint integration with idempotency and retry-safe client behavior.',
    ],
    ctaLabel: 'Open Payment Page',
    ctaHref: '/payment',
  },
  sdks: {
    slug: 'sdks',
    section: 'Resources',
    title: 'SDKs',
    subtitle: 'Planned client SDK support for common backend and frontend stacks.',
    highlights: [
      'REST-first integration works today in any language.',
      'TypeScript-first patterns available in this repository.',
      'Planned helper SDKs for server-side integrations.',
      'Webhook utility helpers for robust event handling.',
    ],
    details: [
      'While official SDK packages are evolving, current API endpoints are stable and can be integrated directly with standard HTTP clients.',
      'Teams that need starter wrappers can build typed clients quickly using the documented endpoint contracts.',
    ],
    ctaLabel: 'Read Documentation',
    ctaHref: '/documentation',
  },
  status: {
    slug: 'status',
    section: 'Resources',
    title: 'System Status',
    subtitle: 'Service availability and operational status for core API components.',
    highlights: [
      'API health status for backend services.',
      'Connectivity status for MongoDB and Redis layers.',
      'Payment flow health for checkout initiation.',
      'Incident reporting and recovery updates.',
    ],
    details: [
      'For live checks, use the backend health endpoint and deployment logs in your hosting platform.',
      'Production teams should wire alerts to monitor latency, error rates, and downstream dependencies.',
    ],
    ctaLabel: 'Health Endpoint',
    ctaHref: 'https://fintech-payment-gateway.onrender.com/health',
  },
  privacy: {
    slug: 'privacy',
    section: 'Legal',
    title: 'Privacy Policy',
    subtitle: 'How FinPay handles personal and transaction-related data.',
    highlights: [
      'Collected data is limited to what is required for service operation.',
      'Access controls and encryption protect stored information.',
      'Retention windows align with operational and compliance needs.',
      'Users can request data updates through support channels.',
    ],
    details: [
      'FinPay is designed to process sensitive information responsibly and with clear access boundaries.',
      'Policy details should be reviewed by legal teams before production rollout in regulated regions.',
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
      'These terms govern platform usage and should be accepted before onboarding production merchants.',
      'For enterprise agreements, custom terms can be discussed to match procurement requirements.',
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
      'Teams embedding FinPay should align this policy with regional requirements before launch.',
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
      'License review is recommended before enterprise deployment.',
      'Third-party payment providers have separate service terms.',
      'Updates should be tracked through release governance.',
    ],
    details: [
      'This platform uses open-source libraries across runtime, UI, and data layers.',
      'Teams should include regular dependency and license reviews as part of release management.',
    ],
    ctaLabel: 'Back To Home',
    ctaHref: '/',
  },
}
