import axios from 'axios'
import { parseUnits } from 'ethers'
import { config } from '../config/env'

interface TokenMeta {
  symbol: string
  providerSymbol: string
  decimals: number
}

const tokenMap: Record<string, TokenMeta> = {
  ETH: { symbol: 'ETH', providerSymbol: 'ETH', decimals: 18 },
  BTC: { symbol: 'BTC', providerSymbol: 'WBTC', decimals: 8 },
  USDC: { symbol: 'USDC', providerSymbol: 'USDC', decimals: 6 },
  USDT: { symbol: 'USDT', providerSymbol: 'USDT', decimals: 6 },
  WBTC: { symbol: 'WBTC', providerSymbol: 'WBTC', decimals: 8 },
  DAI: { symbol: 'DAI', providerSymbol: 'DAI', decimals: 18 },
  MATIC: { symbol: 'MATIC', providerSymbol: 'MATIC', decimals: 18 },
}

export interface SwapQuoteInput {
  fromSymbol: string
  toSymbol: string
  amount: string
  slippagePercentage?: number
  takerAddress?: string
}

export interface SwapQuoteResult {
  from: string
  to: string
  amount: number
  receivedAmount: number
  exchangeRate: number
  slippage: string
  fee: number
  feeCurrency: string
  validFor: number
  provider: string
  quote?: unknown
}

function resolveToken(symbol: string): TokenMeta {
  const token = tokenMap[symbol.toUpperCase()]
  if (!token) {
    throw new Error(`Unsupported token: ${symbol}`)
  }
  return token
}

function toBaseUnits(amount: string, decimals: number): string {
  return parseUnits(amount, decimals).toString()
}

export async function getSwapQuote(input: SwapQuoteInput): Promise<SwapQuoteResult> {
  const fromToken = resolveToken(input.fromSymbol)
  const toToken = resolveToken(input.toSymbol)
  const amount = Number(input.amount)

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than zero.')
  }

  const sellAmount = toBaseUnits(String(amount), fromToken.decimals)
  const baseUrl = config.swapProviderBaseUrl.replace(/\/$/, '')
  const slippage = Number.isFinite(input.slippagePercentage)
    ? Number(input.slippagePercentage)
    : 0.5

  const headers: Record<string, string> = {}
  if (config.swapProviderApiKey) {
    headers['0x-api-key'] = config.swapProviderApiKey
  }

  const response = await axios.get(`${baseUrl}/swap/v1/quote`, {
    params: {
      sellToken: fromToken.providerSymbol,
      buyToken: toToken.providerSymbol,
      sellAmount,
      slippagePercentage: slippage / 100,
      ...(input.takerAddress ? { takerAddress: input.takerAddress } : {}),
    },
    headers,
    timeout: 12000,
  })

  const data = response.data as any
  const buyAmountRaw = Number(data?.buyAmount || 0)
  const estimatedGas = Number(data?.estimatedGas || 0)
  const gasPrice = Number(data?.gasPrice || 0)
  const estimatedGasFeeNative = estimatedGas > 0 && gasPrice > 0
    ? (estimatedGas * gasPrice) / 1e18
    : 0
  const receivedAmount = buyAmountRaw / 10 ** toToken.decimals
  const exchangeRate = receivedAmount / amount

  return {
    from: fromToken.symbol,
    to: toToken.symbol,
    amount,
    receivedAmount,
    exchangeRate,
    slippage: `${slippage}%`,
    fee: estimatedGasFeeNative,
    feeCurrency: 'ETH',
    validFor: 300,
    provider: '0x',
    quote: data,
  }
}
