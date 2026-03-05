import { useQuery } from 'react-query'
import axios from 'axios'
import { API_BASE_URL } from '../utils/api'

interface CryptoPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
}

interface PriceResponse {
  prices: CryptoPrice[]
  lastUpdated: string
}

export const usePrices = () => {
  return useQuery<PriceResponse>(
    'crypto-prices',
    async () => {
      const { data } = await axios.get(`${API_BASE_URL}/crypto/prices`)
      return data
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 15000,
    }
  )
}

export const usePriceHistory = (symbol: string, days: number = 7) => {
  return useQuery(
    ['price-history', symbol, days],
    async () => {
      const { data } = await axios.get(`${API_BASE_URL}/crypto/history/${symbol}?days=${days}`)
      return data
    },
    {
      enabled: !!symbol,
    }
  )
}

export const useSwapQuote = (fromToken: string, toToken: string, amount: string) => {
  return useQuery(
    ['swap-quote', fromToken, toToken, amount],
    async () => {
      const { data } = await axios.get(
        `${API_BASE_URL}/crypto/quote?from=${fromToken}&to=${toToken}&amount=${amount}`
      )
      return data
    },
    {
      enabled: !!fromToken && !!toToken && !!amount && amount !== '0',
    }
  )
}
