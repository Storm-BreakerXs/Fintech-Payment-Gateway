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
    alt: 'Security monitoring screens in an operations center.',
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
    alt: 'Software engineer working on code and API integrations.',
  },
  supportTeam: {
    src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
    alt: 'Support team discussing customer onboarding and implementation plans.',
  },
} satisfies Record<string, VisualAsset>
