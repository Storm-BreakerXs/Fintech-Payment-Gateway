import express, { Request, Response } from 'express'
import axios from 'axios'
import { query, validationResult } from 'express-validator'
import { cacheGet, cacheSet } from '../utils/redis'
import { asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'

const router = express.Router()

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ''
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

// Get live crypto prices
router.get('/prices', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cached = await cacheGet('crypto_prices')
    if (cached) {
      return res.json(JSON.parse(cached))
    }

    // Fetch from CoinGecko (free tier)
    const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
      params: {
        ids: 'bitcoin,ethereum,binancecoin,solana,matic-network,avalanche-2,chainlink,uniswap',
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
        include_24hr_vol: true
      },
      timeout: 5000
    })

    const priceData = response.data

    const formattedPrices = [
      { symbol: 'BTC', name: 'Bitcoin', price: priceData.bitcoin.usd, change24h: priceData.bitcoin.usd_24h_change, marketCap: priceData.bitcoin.usd_market_cap, volume24h: priceData.bitcoin.usd_24h_vol },
      { symbol: 'ETH', name: 'Ethereum', price: priceData.ethereum.usd, change24h: priceData.ethereum.usd_24h_change, marketCap: priceData.ethereum.usd_market_cap, volume24h: priceData.ethereum.usd_24h_vol },
      { symbol: 'BNB', name: 'BNB', price: priceData.binancecoin.usd, change24h: priceData.binancecoin.usd_24h_change, marketCap: priceData.binancecoin.usd_market_cap, volume24h: priceData.binancecoin.usd_24h_vol },
      { symbol: 'SOL', name: 'Solana', price: priceData.solana.usd, change24h: priceData.solana.usd_24h_change, marketCap: priceData.solana.usd_market_cap, volume24h: priceData.solana.usd_24h_vol },
      { symbol: 'MATIC', name: 'Polygon', price: priceData['matic-network'].usd, change24h: priceData['matic-network'].usd_24h_change, marketCap: priceData['matic-network'].usd_market_cap, volume24h: priceData['matic-network'].usd_24h_vol },
      { symbol: 'AVAX', name: 'Avalanche', price: priceData['avalanche-2'].usd, change24h: priceData['avalanche-2'].usd_24h_change, marketCap: priceData['avalanche-2'].usd_market_cap, volume24h: priceData['avalanche-2'].usd_24h_vol },
      { symbol: 'LINK', name: 'Chainlink', price: priceData.chainlink.usd, change24h: priceData.chainlink.usd_24h_change, marketCap: priceData.chainlink.usd_market_cap, volume24h: priceData.chainlink.usd_24h_vol },
      { symbol: 'UNI', name: 'Uniswap', price: priceData.uniswap.usd, change24h: priceData.uniswap.usd_24h_change, marketCap: priceData.uniswap.usd_market_cap, volume24h: priceData.uniswap.usd_24h_vol },
    ]

    const result = {
      prices: formattedPrices,
      lastUpdated: new Date().toISOString()
    }

    // Cache for 30 seconds
    await cacheSet('crypto_prices', JSON.stringify(result), 30)

    res.json(result)
  } catch (error) {
    logger.error('Error fetching crypto prices:', error)

    // Return fallback data if API fails
    res.json({
      prices: [
        { symbol: 'BTC', name: 'Bitcoin', price: 67234.56, change24h: 2.34, marketCap: 1300000000000, volume24h: 35000000000 },
        { symbol: 'ETH', name: 'Ethereum', price: 3521.78, change24h: 1.89, marketCap: 420000000000, volume24h: 18000000000 },
        { symbol: 'BNB', name: 'BNB', price: 432.15, change24h: -0.45, marketCap: 65000000000, volume24h: 1200000000 },
        { symbol: 'SOL', name: 'Solana', price: 178.92, change24h: 5.67, marketCap: 78000000000, volume24h: 3500000000 },
        { symbol: 'MATIC', name: 'Polygon', price: 0.89, change24h: -1.23, marketCap: 8200000000, volume24h: 450000000 },
        { symbol: 'AVAX', name: 'Avalanche', price: 42.34, change24h: 3.21, marketCap: 15500000000, volume24h: 680000000 },
        { symbol: 'LINK', name: 'Chainlink', price: 18.76, change24h: 0.98, marketCap: 10500000000, volume24h: 420000000 },
        { symbol: 'UNI', name: 'Uniswap', price: 12.45, change24h: -2.34, marketCap: 7500000000, volume24h: 280000000 },
      ],
      lastUpdated: new Date().toISOString(),
      fallback: true
    })
  }
}))

// Get price history
router.get('/history/:symbol', [
  query('days').optional().isInt({ min: 1, max: 365 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { symbol } = req.params
  const days = parseInt(req.query.days as string) || 7

  const coinIdMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'UNI': 'uniswap'
  }

  const coinId = coinIdMap[symbol.toUpperCase()]
  if (!coinId) {
    return res.status(400).json({ error: 'Unsupported symbol' })
  }

  try {
    const response = await axios.get(
      `${COINGECKO_API_URL}/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days
        },
        timeout: 5000
      }
    )

    const prices = response.data.prices.map((p: [number, number]) => ({
      timestamp: p[0],
      price: p[1]
    }))

    res.json({
      symbol: symbol.toUpperCase(),
      days,
      prices
    })
  } catch (error) {
    logger.error('Error fetching price history:', error)
    res.status(500).json({ error: 'Failed to fetch price history' })
  }
}))

// Get swap quote (mock implementation)
router.get('/quote', [
  query('from').notEmpty(),
  query('to').notEmpty(),
  query('amount').isFloat({ min: 0 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { from, to, amount } = req.query as { from: string; to: string; amount: string }

  // Mock exchange rates
  const rates: Record<string, number> = {
    'ETH-USDC': 3500,
    'USDC-ETH': 1/3500,
    'BTC-USDC': 67000,
    'USDC-BTC': 1/67000,
    'ETH-BTC': 0.052,
    'BTC-ETH': 19.2
  }

  const rate = rates[`${from}-${to}`] || 1
  const receivedAmount = parseFloat(amount) * rate

  // Mock slippage and fees
  const slippage = 0.5
  const fee = parseFloat(amount) * 0.003

  res.json({
    from,
    to,
    amount: parseFloat(amount),
    receivedAmount: receivedAmount * (1 - slippage/100),
    exchangeRate: rate,
    slippage: `${slippage}%`,
    fee: fee,
    feeCurrency: from,
    validFor: 300 // 5 minutes
  })
}))

// Get supported tokens
router.get('/tokens', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    tokens: [
      { symbol: 'ETH', name: 'Ethereum', decimals: 18, chainId: 1, isNative: true },
      { symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 1, address: '0xA0b86a33E6441E6C7D3D4B4f6c7D3D4B4f6c7D3' },
      { symbol: 'USDT', name: 'Tether', decimals: 6, chainId: 1, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, chainId: 1, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
      { symbol: 'MATIC', name: 'Polygon', decimals: 18, chainId: 137, isNative: true },
      { symbol: 'BNB', name: 'BNB', decimals: 18, chainId: 56, isNative: true },
      { symbol: 'AVAX', name: 'Avalanche', decimals: 18, chainId: 43114, isNative: true },
    ]
  })
}))

export default router
