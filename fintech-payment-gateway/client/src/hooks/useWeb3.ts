import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { create } from 'zustand'
import type { CoinbaseWalletProvider } from '@coinbase/wallet-sdk'

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase'

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void
}

interface InjectedEthereumProvider extends Eip1193Provider {
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  providers?: InjectedEthereumProvider[]
}

interface Web3State {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  address: string | null
  balance: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  connect: (walletType: WalletType) => Promise<void>
  disconnect: () => void
  initialize: () => void
  switchNetwork: (chainId: number) => Promise<void>
  getBalance: () => Promise<void>
}

const SUPPORTED_CHAINS = [1, 137, 56, 43114, 5, 1337]
const WALLET_ADDRESS_KEY = 'walletAddress'
const WALLET_TYPE_KEY = 'walletType'

const DEFAULT_RPC_URLS: Record<number, string> = {
  1: 'https://cloudflare-eth.com',
  5: 'https://ethereum-goerli.publicnode.com',
  56: 'https://bsc-dataseed.binance.org',
  137: 'https://polygon-rpc.com',
  43114: 'https://api.avax.network/ext/bc/C/rpc',
}

type CoinbaseWalletSDKCtor = (typeof import('@coinbase/wallet-sdk'))['default']

let coinbaseWalletSdk: InstanceType<CoinbaseWalletSDKCtor> | null = null
let coinbaseWalletProvider: CoinbaseWalletProvider | null = null
let activeExternalProvider: Eip1193Provider | null = null
let activeAccountsChangedHandler: ((...args: unknown[]) => void) | null = null
let activeChainChangedHandler: ((...args: unknown[]) => void) | null = null
let activeWalletType: WalletType | null = null

function getInjectedProviders(): InjectedEthereumProvider[] {
  if (!window.ethereum) {
    return []
  }

  const ethereum = window.ethereum as InjectedEthereumProvider
  if (Array.isArray(ethereum.providers)) {
    return ethereum.providers
  }

  return [ethereum]
}

function pickInjectedProvider(walletType: WalletType): InjectedEthereumProvider | null {
  const providers = getInjectedProviders()
  if (providers.length === 0) {
    return null
  }

  if (walletType === 'coinbase') {
    return providers.find((provider) => provider.isCoinbaseWallet) || null
  }

  if (walletType === 'metamask') {
    return providers.find((provider) => provider.isMetaMask && !provider.isCoinbaseWallet) || null
  }

  return null
}

function getSavedWalletType(): WalletType {
  const saved = localStorage.getItem(WALLET_TYPE_KEY)
  if (saved === 'metamask' || saved === 'walletconnect' || saved === 'coinbase') {
    return saved
  }
  return 'metamask'
}

function getDefaultCoinbaseChainId(): number {
  const raw = import.meta.env.VITE_COINBASE_CHAIN_ID
  if (!raw) return 1

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 1
  }

  return parsed
}

function getCoinbaseRpcUrl(chainId: number): string {
  const envRpc = import.meta.env.VITE_COINBASE_RPC_URL?.trim()
  if (envRpc) {
    return envRpc
  }

  return DEFAULT_RPC_URLS[chainId] || DEFAULT_RPC_URLS[1]
}

function clearWalletStorage(): void {
  localStorage.removeItem(WALLET_ADDRESS_KEY)
  localStorage.removeItem(WALLET_TYPE_KEY)
}

function detachProviderListeners(): void {
  if (activeExternalProvider?.removeListener && activeAccountsChangedHandler) {
    activeExternalProvider.removeListener('accountsChanged', activeAccountsChangedHandler)
  }

  if (activeExternalProvider?.removeListener && activeChainChangedHandler) {
    activeExternalProvider.removeListener('chainChanged', activeChainChangedHandler)
  }

  activeAccountsChangedHandler = null
  activeChainChangedHandler = null
  activeExternalProvider = null
}

export const useWeb3Store = create<Web3State>((set, get) => ({
  provider: null,
  signer: null,
  address: null,
  balance: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,

  initialize: () => {
    const savedAddress = localStorage.getItem(WALLET_ADDRESS_KEY)
    if (!savedAddress) {
      return
    }

    const savedWalletType = getSavedWalletType()
    void get().connect(savedWalletType).catch(() => {
      clearWalletStorage()
    })
  },

  connect: async (walletType: WalletType) => {
    const state = get()
    if (state.isConnecting) return

    set({ isConnecting: true })

    try {
      detachProviderListeners()

      if (walletType === 'walletconnect') {
        throw new Error('WalletConnect integration coming soon.')
      }

      let externalProvider: Eip1193Provider

      if (walletType === 'metamask') {
        const injectedMetaMask = pickInjectedProvider('metamask')
        if (!injectedMetaMask) {
          throw new Error('MetaMask not installed. Please install MetaMask.')
        }
        externalProvider = injectedMetaMask
      } else {
        const injectedCoinbase = pickInjectedProvider('coinbase')
        if (injectedCoinbase) {
          externalProvider = injectedCoinbase
        } else {
          const defaultChainId = getDefaultCoinbaseChainId()
          const jsonRpcUrl = getCoinbaseRpcUrl(defaultChainId)
          const appName = import.meta.env.VITE_COINBASE_APP_NAME?.trim() || 'FinPay'
          const appLogoUrl = import.meta.env.VITE_COINBASE_APP_LOGO_URL?.trim() || null
          const { default: CoinbaseWalletSDK } = await import('@coinbase/wallet-sdk')

          if (!coinbaseWalletSdk) {
            coinbaseWalletSdk = new CoinbaseWalletSDK({
              appName,
              appLogoUrl,
              reloadOnDisconnect: false,
            })
          }

          if (!coinbaseWalletProvider) {
            coinbaseWalletProvider = coinbaseWalletSdk.makeWeb3Provider(jsonRpcUrl, defaultChainId)
          } else {
            coinbaseWalletProvider.setProviderInfo(jsonRpcUrl, defaultChainId)
          }

          externalProvider = coinbaseWalletProvider as unknown as Eip1193Provider
        }
      }

      const provider = new ethers.BrowserProvider(externalProvider)
      const accounts = await provider.send('eth_requestAccounts', [])

      if (accounts.length === 0) {
        throw new Error('No wallet account found. Please unlock your wallet.')
      }

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const chainId = Number(network.chainId)

      if (!SUPPORTED_CHAINS.includes(chainId)) {
        toast.error('Please switch to a supported network (Ethereum, Polygon, BSC, or Avalanche)')
      }

      const balanceWei = await provider.getBalance(address)
      const balance = ethers.formatEther(balanceWei)

      activeAccountsChangedHandler = (...args: unknown[]) => {
        const nextAccountsRaw = args[0]
        const nextAccounts = Array.isArray(nextAccountsRaw)
          ? nextAccountsRaw.filter((item): item is string => typeof item === 'string')
          : []

        if (nextAccounts.length === 0) {
          get().disconnect()
          return
        }

        void get().connect(walletType)
      }

      activeChainChangedHandler = () => {
        window.location.reload()
      }

      externalProvider.on?.('accountsChanged', activeAccountsChangedHandler)
      externalProvider.on?.('chainChanged', activeChainChangedHandler)

      activeExternalProvider = externalProvider
      activeWalletType = walletType

      localStorage.setItem(WALLET_ADDRESS_KEY, address)
      localStorage.setItem(WALLET_TYPE_KEY, walletType)

      set({
        provider,
        signer,
        address,
        balance,
        chainId,
        isConnected: true,
        isConnecting: false,
      })

      if (walletType === 'coinbase') {
        toast.success('Coinbase Wallet connected successfully!')
      } else {
        toast.success('MetaMask connected successfully!')
      }
    } catch (error) {
      set({ isConnecting: false })
      console.error('Connection error:', error)
      throw error
    }
  },

  disconnect: () => {
    clearWalletStorage()
    detachProviderListeners()

    if (activeWalletType === 'coinbase' && activeExternalProvider === (coinbaseWalletProvider as unknown as Eip1193Provider | null)) {
      coinbaseWalletProvider?.disconnect()
      coinbaseWalletProvider = null
    }

    activeWalletType = null

    set({
      provider: null,
      signer: null,
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
    })

    toast.success('Wallet disconnected')
  },

  switchNetwork: async (targetChainId: number) => {
    const { provider } = get()
    const requestProvider = activeExternalProvider || (window.ethereum as Eip1193Provider | undefined)

    if (!provider || !requestProvider) return

    try {
      await requestProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (error) {
      const switchError = error as { code?: number }

      if (switchError.code === 4902) {
        const chainParams: Record<number, unknown> = {
          137: {
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
          },
          56: {
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org'],
            blockExplorerUrls: ['https://bscscan.com'],
          },
          43114: {
            chainId: '0xA86A',
            chainName: 'Avalanche C-Chain',
            nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
            rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
            blockExplorerUrls: ['https://snowtrace.io'],
          },
        }

        if (chainParams[targetChainId]) {
          await requestProvider.request({
            method: 'wallet_addEthereumChain',
            params: [chainParams[targetChainId] as object],
          })
        }
      }
    }
  },

  getBalance: async () => {
    const { provider, address } = get()
    if (!provider || !address) return

    try {
      const balanceWei = await provider.getBalance(address)
      const balance = ethers.formatEther(balanceWei)
      set({ balance })
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  },
}))

declare global {
  interface Window {
    ethereum?: any
  }
}
