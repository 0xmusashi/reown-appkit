import { useCallback, useEffect, useState } from 'react'

// Define network types
export type NetworkType = 'mainnet-beta' | 'testnet' | 'devnet'

// Network configurations
const NETWORKS = {
  'mainnet-beta': {
    endpoint: 'https://api.mainnet-beta.solana.com',
    chainId: '101'
  },
  testnet: {
    endpoint: 'https://api.testnet.solana.com',
    chainId: '102'
  },
  devnet: {
    endpoint: 'https://api.devnet.solana.com',
    chainId: '103'
  }
}

// Mock wallet for demo purposes
const MOCK_WALLET = {
  publicKey: '9ZNTfG4NyQgxy2SWjSiQoUyBPEvXT2xo7fKc5hPYYJ7b',
  privateKey: new Uint8Array(32).fill(1) // This is just a mock, not a real key
}

// Return type for our hook
export interface UseSolanaResult {
  address: string | null
  balance: number | null
  network: NetworkType
  isConnected: boolean
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  switchNetwork: (network: NetworkType) => void
  signMessage: (message: string) => Promise<string>
  sendTransaction: (recipient: string, amount: number) => Promise<{ hash: string }>
  refreshBalance: () => Promise<void>
}

export function useSolana(enableGasSponsorship: boolean = true): UseSolanaResult {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [network, setNetwork] = useState<NetworkType>('devnet')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connection, setConnection] = useState<any | null>(null)

  // Initialize connection when network changes
  useEffect(() => {
    const networkConfig = NETWORKS[network]
    // Mock connection object
    const newConnection = { endpoint: networkConfig.endpoint }
    setConnection(newConnection)

    // Reset connection state when network changes
    if (isConnected) {
      setIsConnected(false)
      setAddress(null)
      setBalance(null)
    }
  }, [network, isConnected])

  // Fetch mock balance for the connected address
  const fetchBalance = useCallback(async () => {
    if (!address || !connection) {
      setBalance(null)
      return
    }

    try {
      // For demo purposes, return random balance between 1 and 10 SOL
      const mockBalance = Math.random() * 9 + 1
      setBalance(mockBalance)
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance(null)
    }
  }, [address, connection])

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    await fetchBalance()
  }, [fetchBalance])

  // Update balance when address or connection changes
  useEffect(() => {
    if (address && connection) {
      fetchBalance()
    }
  }, [address, connection, fetchBalance])

  // Connect wallet
  const connect = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    console.log('Connecting wallet...')

    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Set connection data
      console.log('Setting mock wallet data')
      setAddress(MOCK_WALLET.publicKey)
      setIsConnected(true)

      // Fetch initial balance
      console.log('Fetching balance...')
      await fetchBalance()
      console.log('Connection complete!')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      setAddress(null)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [fetchBalance, isLoading])

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      // Simulate disconnect delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setAddress(null)
      setBalance(null)
      setIsConnected(false)
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }, [])

  // Switch network
  const switchNetwork = useCallback((newNetwork: NetworkType) => {
    setNetwork(newNetwork)
  }, [])

  // Sign message
  const signMessage = useCallback(
    async (message: string) => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected')
      }

      try {
        // Simulate signing delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // For demo, return a mock signature (base64 encoded)
        const mockSignature = btoa(`${message}-signed-with-mock-wallet`)
        return mockSignature
      } catch (error) {
        console.error('Error signing message:', error)
        throw error
      }
    },
    [isConnected, address]
  )

  // Send transaction
  const sendTransaction = useCallback(
    async (recipient: string, amount: number) => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected')
      }

      try {
        // Validate recipient address format (simplified check)
        if (!recipient || recipient.length !== 44) {
          throw new Error('Invalid recipient address')
        }

        // Validate amount
        if (amount <= 0) {
          throw new Error('Amount must be greater than 0')
        }

        // Check if balance is sufficient
        if (balance !== null && amount > balance) {
          throw new Error('Insufficient balance')
        }

        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Generate mock transaction hash
        const mockTxHash = Array.from(
          { length: 64 },
          () => '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('')

        // Deduct amount from balance if gas sponsorship is not enabled
        if (!enableGasSponsorship && balance !== null) {
          // Mock a small fee
          const fee = 0.000005
          setBalance(balance - amount - fee)
        } else if (balance !== null) {
          // No fee deducted with gas sponsorship
          setBalance(balance - amount)
        }

        return { hash: mockTxHash }
      } catch (error) {
        console.error('Error sending transaction:', error)
        throw error
      }
    },
    [isConnected, address, balance, enableGasSponsorship]
  )

  return {
    address,
    balance,
    network,
    isConnected,
    isLoading,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
    sendTransaction,
    refreshBalance
  }
}
