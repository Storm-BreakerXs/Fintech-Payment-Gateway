import { useEffect, useMemo, useState } from 'react'
import { Activity, TrendingDown, TrendingUp } from 'lucide-react'

interface MarketPrice {
  symbol: string
  price: number
  change24h: number
}

const basePrices: MarketPrice[] = [
  { symbol: 'BTC', price: 67234.56, change24h: 2.34 },
  { symbol: 'ETH', price: 3521.78, change24h: 1.89 },
  { symbol: 'SOL', price: 178.92, change24h: 5.67 },
  { symbol: 'USDC', price: 1.0, change24h: 0.02 },
  { symbol: 'AVAX', price: 42.34, change24h: 3.21 },
  { symbol: 'LINK', price: 18.76, change24h: 0.98 },
]

function formatPrice(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    })
  }

  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  })
}

export default function PriceTicker() {
  const [prices, setPrices] = useState<MarketPrice[]>(basePrices)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return

      setPrices((previous) => previous.map((item) => ({
        ...item,
        price: item.price * (1 + (Math.random() - 0.5) * 0.0018),
        change24h: item.change24h + (Math.random() - 0.5) * 0.08,
      })))
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused])

  const tickerItems = useMemo(() => [...prices, ...prices], [prices])

  return (
    <div
      className="border-b border-slate-700/70 bg-slate-950/90"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-4 overflow-hidden">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-100 flex-shrink-0">
          <Activity className="w-3.5 h-3.5" />
          <span>Live Markets</span>
        </div>
        <div className="ticker flex whitespace-nowrap min-w-0">
          {tickerItems.map((item, index) => {
            const positive = item.change24h >= 0
            return (
              <div
                key={`${item.symbol}-${index}`}
                className="inline-flex items-center gap-2 border-r border-slate-700/70 px-4"
              >
                <span className="text-xs font-semibold text-slate-200">{item.symbol}</span>
                <span className="text-xs text-slate-100 font-mono">{formatPrice(item.price)}</span>
                <span className={`inline-flex items-center gap-1 text-[11px] ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {positive ? '+' : ''}{item.change24h.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
