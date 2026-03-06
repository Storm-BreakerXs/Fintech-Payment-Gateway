import { type CSSProperties, useEffect, useMemo, useState } from 'react'
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
  { symbol: 'MATIC', price: 0.8862, change24h: -1.51 },
  { symbol: 'USDC', price: 1.0, change24h: 0.02 },
  { symbol: 'AVAX', price: 42.34, change24h: 3.21 },
  { symbol: 'LINK', price: 18.76, change24h: 0.98 },
  { symbol: 'UNI', price: 12.41, change24h: -2.26 },
  { symbol: 'BNB', price: 495.4, change24h: 1.84 },
]

interface CoinGeckoMarket {
  symbol: string
  current_price: number
  price_change_percentage_24h: number | null
}

const COINGECKO_MARKETS_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h'
const REFRESH_INTERVAL_MS = 60_000

function formatPrice(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    })
  }

  if (value >= 1) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (value >= 0.01) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }

  if (value >= 0.0001) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    })
  }

  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 6,
    maximumFractionDigits: 8,
  })
}

export default function PriceTicker() {
  const [prices, setPrices] = useState<MarketPrice[]>(basePrices)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    const loadMarkets = async () => {
      try {
        const response = await fetch(COINGECKO_MARKETS_URL, { signal: controller.signal })
        if (!response.ok) return

        const data = (await response.json()) as CoinGeckoMarket[]
        if (!isActive) return

        const seenSymbols = new Set<string>()
        const nextPrices: MarketPrice[] = []

        for (const market of data) {
          const symbol = String(market.symbol || '').toUpperCase()
          if (!symbol || seenSymbols.has(symbol)) continue
          if (!Number.isFinite(market.current_price)) continue

          seenSymbols.add(symbol)
          nextPrices.push({
            symbol,
            price: market.current_price,
            change24h: Number.isFinite(market.price_change_percentage_24h ?? NaN)
              ? Number(market.price_change_percentage_24h)
              : 0,
          })
        }

        if (nextPrices.length) {
          setPrices(nextPrices)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    loadMarkets()
    const intervalId = window.setInterval(loadMarkets, REFRESH_INTERVAL_MS)

    return () => {
      isActive = false
      controller.abort()
      window.clearInterval(intervalId)
    }
  }, [])

  const tickerItems = useMemo(() => [...prices, ...prices], [prices])
  const tickerStyle = useMemo(
    () => ({ '--ticker-duration': `${Math.max(60, prices.length * 3)}s` } as CSSProperties),
    [prices.length]
  )

  return (
    <div
      className="border-b border-slate-700/70 bg-slate-950/90"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-4 overflow-hidden">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-100 flex-shrink-0 relative z-10 border-r border-slate-700/70 pr-4">
          <Activity className="w-3.5 h-3.5" />
          <span>Live Markets</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className={`ticker inline-flex w-max whitespace-nowrap ${isPaused ? 'ticker-paused' : ''}`} style={tickerStyle}>
            {tickerItems.map((item, index) => {
              const positive = item.change24h >= 0
              return (
                <div
                  key={`${item.symbol}-${index}`}
                  className="inline-flex w-44 shrink-0 items-center justify-between gap-2 border-r border-slate-700/70 px-4"
                >
                  <span className="text-xs font-semibold text-slate-200">{item.symbol}</span>
                  <span className="text-xs text-slate-100 font-mono tabular-nums">{formatPrice(item.price)}</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-mono tabular-nums ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {positive ? '+' : ''}{item.change24h.toFixed(2)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
