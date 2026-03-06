export interface VisualAsset {
  src: string
  alt: string
}

export const visualAssets = {
  heroCheckout: {
    src: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1600&q=80',
    alt: 'Merchant accepting a digital payment on a modern checkout terminal.',
  },
  globalNetwork: {
    src: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&w=1600&q=80',
    alt: 'Glowing view of Earth at night representing global payment coverage.',
  },
  securityOps: {
    src: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1400&q=80',
    alt: 'Security monitoring screens protecting online payments.',
  },
  merchantVerticals: {
    src: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?auto=format&fit=crop&w=1600&q=80',
    alt: 'Business team reviewing analytics dashboard and payment performance.',
  },
  paymentSuccess: {
    src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Customer receiving a successful mobile payment confirmation.',
  },
  paymentFailure: {
    src: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=1200&q=80',
    alt: 'User reviewing a failed online transaction message on a laptop.',
  },
  developerApi: {
    src: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1400&q=80',
    alt: 'Team member working on secure payment integrations.',
  },
  supportTeam: {
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
    alt: 'Support team discussing customer onboarding and launch plans.',
  },
  paymentOperations: {
    src: 'https://images.unsplash.com/photo-1551281044-8af1f1f4c4f8?auto=format&fit=crop&w=1600&q=80',
    alt: 'Payment operations dashboard with real-time business insights.',
  },
  analyticsCenter: {
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80',
    alt: 'Business analytics screen showing trends, charts, and performance metrics.',
  },
  crossBorderTeam: {
    src: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80',
    alt: 'Team planning global expansion and cross-border payment strategy.',
  },
  enterpriseMeeting: {
    src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
    alt: 'Business leaders reviewing product roadmap and payment growth plans.',
  },
  onboardingJourney: {
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&q=80',
    alt: 'Project onboarding board showing milestones and launch tasks.',
  },
  developerWorkspace: {
    src: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=80',
    alt: 'Developer workspace with payment integration code on screen.',
  },
  salesConversation: {
    src: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1600&q=80',
    alt: 'Customer success manager in a focused sales conversation.',
  },
  accountAccess: {
    src: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1600&q=80',
    alt: 'Secure login and identity verification experience on a mobile device.',
  },
  settingsControl: {
    src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80',
    alt: 'User adjusting security and account preferences in a control panel.',
  },
  policyCompliance: {
    src: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80',
    alt: 'Legal and compliance documents prepared for policy review.',
  },
  failedRecovery: {
    src: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1600&q=80',
    alt: 'Customer support workflow for resolving failed payment attempts.',
  },
  siteProductBrief: {
    src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
    alt: 'Product planning workspace with design and roadmap notes.',
  },
  siteCompanyBrief: {
    src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=80',
    alt: 'Company team collaborating in a strategy meeting.',
  },
  siteResourcesBrief: {
    src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80',
    alt: 'Knowledge resources and documentation viewed on laptops.',
  },
  siteLegalBrief: {
    src: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1600&q=80',
    alt: 'Legal review workspace with policy and compliance documents.',
  },
} satisfies Record<string, VisualAsset>
