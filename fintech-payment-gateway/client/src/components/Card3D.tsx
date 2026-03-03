import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Wifi, CreditCard as CardIcon } from 'lucide-react'

interface Card3DProps {
  cardNumber?: string
  cardHolder?: string
  expiryDate?: string
  cvv?: string
  isFlipped?: boolean
  cardType?: 'visa' | 'mastercard' | 'amex'
}

export default function Card3D({
  cardNumber = '•••• •••• •••• ••••',
  cardHolder = 'YOUR NAME',
  expiryDate = 'MM/YY',
  cvv = '•••',
  isFlipped = false,
  cardType = 'visa',
}: Card3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    const rotateX = (mouseY / (rect.height / 2)) * -15
    const rotateY = (mouseX / (rect.width / 2)) * 15

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  const formatCardNumber = (num: string) => {
    if (num.includes('•')) return num
    return num.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const getCardLogo = () => {
    switch (cardType) {
      case 'visa':
        return (
          <svg className="w-16 h-6" viewBox="0 0 48 16" fill="none">
            <path d="M17.68 1.5l-4.68 11h-3.08l-2.3-8.9c-.14-.54-.26-.74-.68-.96C5.92 1.98 4.68 1.5 3.6 1.24l.08-.36h5.72c.74 0 1.4.5 1.56 1.36l1.2 6.4L16.16 1.5h3.52zm14.96 7.4c.02-2.9-4-3.06-3.98-4.36.02-.4.38-.82 1.2-.92.4-.06 1.52-.1 2.78.54l.5-2.32c-.68-.24-1.54-.48-2.62-.48-2.76 0-4.7 1.46-4.72 3.56-.02 1.54 1.38 2.4 2.44 2.92 1.08.52 1.44.86 1.44 1.32-.02.72-.86 1.04-1.66 1.04-1.4 0-2.14-.38-2.76-.68l-.52 2.38c.66.3 1.68.56 2.8.58 2.94 0 4.86-1.46 4.88-3.64l-.78-.04zm7.56 3.6h2.62l-2.28-11h-2.42c-.54 0-1 .32-1.2.8l-4.22 10.2h2.98l.58-1.6h3.62l.34 1.6h.98zm-3.14-3.8l1.48-4.08.86 4.08h-2.34zm-13.4-7.2l-2.36 11h-2.82l2.36-11h2.82z" fill="white"/>
          </svg>
        )
      case 'mastercard':
        return (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-red-500/90" />
            <div className="w-8 h-8 rounded-full bg-yellow-500/90 -ml-4" />
          </div>
        )
      case 'amex':
        return (
          <div className="text-white font-bold text-lg tracking-wider">AMEX</div>
        )
      default:
        return null
    }
  }

  return (
    <div 
      className="perspective-1000 w-full max-w-md mx-auto"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: isFlipped ? 180 : rotation.x,
          rotateY: isFlipped ? 0 : rotation.y,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full aspect-[1.586] preserve-3d cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <div 
          className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Card background with gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 animate-gradient-x" />

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 400 252">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" fill="white"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)"/>
              </svg>
            </div>

            {/* Glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />
          </div>

          {/* Card content */}
          <div className="relative h-full p-6 flex flex-col justify-between">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-8 rounded bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center">
                  <div className="w-6 h-5 border border-yellow-700 rounded-sm" />
                </div>
                <Wifi className="w-6 h-6 text-white/60" />
              </div>
              {getCardLogo()}
            </div>

            {/* Card number */}
            <div className="space-y-1">
              <div className="flex items-center space-x-4">
                <span className="text-2xl sm:text-3xl font-mono text-white tracking-wider drop-shadow-lg">
                  {formatCardNumber(cardNumber)}
                </span>
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <div className="text-xs text-white/60 uppercase tracking-wider">Card Holder</div>
                <div className="text-sm sm:text-base font-medium text-white uppercase tracking-wider">
                  {cardHolder}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-white/60 uppercase tracking-wider">Expires</div>
                <div className="text-sm sm:text-base font-medium text-white font-mono">
                  {expiryDate}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <CardIcon className="w-6 h-6 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div 
          className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20" />
          </div>

          <div className="relative h-full flex flex-col">
            {/* Magnetic strip */}
            <div className="h-12 bg-black mt-6" />

            {/* Signature panel */}
            <div className="px-6 mt-4">
              <div className="bg-slate-200 h-10 rounded flex items-center justify-end px-3">
                <span className="text-slate-800 font-mono text-sm italic">{cvv}</span>
              </div>
              <div className="text-xs text-white/60 mt-1 text-right">CVV</div>
            </div>

            {/* Hologram */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 via-slate-400 to-slate-600 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400/50 via-blue-400/50 to-purple-400/50" />
              </div>
            </div>

            {/* Security text */}
            <div className="px-6 pb-4">
              <p className="text-xs text-white/40 text-center">
                This card is property of FinPay Gateway. Unauthorized use is prohibited.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}