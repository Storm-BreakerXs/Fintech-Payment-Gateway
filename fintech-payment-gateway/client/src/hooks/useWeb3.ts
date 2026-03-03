import { create } from 'zustand'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

interface Web3State {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  address: string | null
  balance: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  connect: (walletType: string) => Promise<void>
  disconnect: () => void
  initialize: () => void
  switchNetwork: (chainId: number) => Promise<void>
  getBalance: () => Promise<void>
}

const SUPPORTED_CHAINS = [1, 137, 56, 43114, 5, 1337]

export const useWeb3Store = create<Web3State>((set, get) => ({
  provider: null,
  signer: null,
  address: null,
  balance: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,

  initialize: () => {
    // Check if wallet was previously connected
    const savedAddress = localStorage.getItem('walletAddress')
    if (savedAddress && window.ethereum) {
      get().connect('metamask').catch(() => {
        localStorage.removeItem('walletAddress')
      })
    }
  },

  connect: async (walletType: string) => {
    const state = get()
    if (state.isConnecting) return

    set({ isConnecting: true })

    try {
      if (walletType === 'metamask') {
        if (!window.ethereum) {
          throw new Error('MetaMask not installed. Please install MetaMask.')
        }

        const provider = new ethers.BrowserProvider(window.ethereum)

        // Request account access
        const accounts = await provider.send('eth_requestAccounts', [])

        if (accounts.length === 0) {
          throw new Error('No accounts found. Please unlock MetaMask.')
        }

        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        const network = await provider.getNetwork()
        const chainId = Number(network.chainId)

        // Check if chain is supported
        if (!SUPPORTED_CHAINS.includes(chainId)) {
          toast.error('Please switch to a supported network (Ethereum, Polygon, BSC, or Avalanche)')
        }

        // Get balance
        const balanceWei = await provider.getBalance(address)
        const balance = ethers.formatEther(balanceWei)

        // Set up event listeners
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            get().disconnect()
          } else {
            get().connect('metamask')
          }
        })

        window.ethereum.on('chainChanged', () => {
          window.location.reload()
        })

        localStorage.setItem('walletAddress', address)

        set({
          provider,
          signer,
          address,
          balance,
          chainId,
          isConnected: true,
          isConnecting: false,
        })

        toast.success('Wallet connected successfully!')
      } else if (walletType === 'walletconnect') {
        // WalletConnect implementation would go here
        toast.error('WalletConnect coming soon!')
      } else if (walletType === 'coinbase') {
        // Coinbase Wallet implementation would go here
        toast.error('Coinbase Wallet coming soon!')
      }
    } catch (error) {
      set({ isConnecting: false })
      console.error('Connection error:', error)
      throw error
    }
  },

  disconnect: () => {
    localStorage.removeItem('walletAddress')

    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged')
      window.ethereum.removeAllListeners('chainChanged')
    }

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
    if (!provider || !window.ethereum) return

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (switchError: any) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        const chainParams: Record<number, any> = {
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
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainParams[targetChainId]],
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

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}