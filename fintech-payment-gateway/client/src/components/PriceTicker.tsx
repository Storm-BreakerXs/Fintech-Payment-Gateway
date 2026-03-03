import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface CryptoPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  logo: string
}

const defaultPrices: CryptoPrice[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67234.56, change24h: 2.34, logo: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 3521.78, change24h: 1.89, logo: 'Ξ' },
  { symbol: 'BNB', name: 'BNB', price: 432.15, change24h: -0.45, logo: 'B' },
  { symbol: 'SOL', name: 'Solana', price: 178.92, change24h: 5.67, logo: 'S' },
  { symbol: 'MATIC', name: 'Polygon', price: 0.89, change24h: -1.23, logo: 'M' },
  { symbol: 'AVAX', name: 'Avalanche', price: 42.34, change24h: 3.21, logo: 'A' },
  { symbol: 'LINK', name: 'Chainlink', price: 18.76, change24h: 0.98, logo: 'L' },
  { symbol: 'UNI', name: 'Uniswap', price: 12.45, change24h: -2.34, logo: 'U' },
]

export default function PriceTicker() {
  const [prices, setPrices] = useState<CryptoPrice[]>(defaultPrices)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    // Simulate live price updates
    const interval = setInterval(() => {
      if (!isPaused) {
        setPrices(prev => prev.map(crypto => ({
          ...crypto,
          price: crypto.price * (1 + (Math.random() - 0.5) * 0.002),
          change24h: crypto.change24h + (Math.random() - 0.5) * 0.1
        })))
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused])

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    }
    return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 })
  }

  // Duplicate prices for seamless loop
  const duplicatedPrices = [...prices, ...prices]

  return (
    <div 
      className="bg-slate-900/80 border-b border-slate-800 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="ticker flex whitespace-nowrap py-2">
        {duplicatedPrices.map((crypto, index) => (
          <motion.div
            key={`${crypto.symbol}-${index}`}
            className="inline-flex items-center space-x-3 px-6 border-r border-slate-800"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-lg font-bold text-slate-500">{crypto.logo}</span>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-slate-300">{crypto.symbol}</span>
                <span className="text-sm font-mono text-white">{formatPrice(crypto.price)}</span>
              </div>
              <div className={`flex items-center space-x-1 text-xs ${
                crypto.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {crypto.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}