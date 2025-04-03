import { useCallback, useEffect, useState } from 'react'

import { useWallet } from '@solana/wallet-adapter-react'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} from '@solana/web3.js'

import { NetworkType } from './useSolana'

// Network configurations
const NETWORK_ENDPOINTS = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  testnet: 'https://api.testnet.solana.com',
  devnet: 'https://api.devnet.solana.com'
}

export interface UseSolanaWalletResult {
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

export function useSolanaWallet(
  network: NetworkType = 'devnet',
  enableGasSponsorship: boolean = true
): UseSolanaWalletResult {
  const {
    publicKey,
    connected,
    connecting,
    disconnect: walletDisconnect,
    signMessage: walletSignMessage,
    signTransaction,
    sendTransaction: walletSendTransaction,
    wallet,
    select,
    wallets
  } = useWallet()

  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>(network)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [connection, setConnection] = useState<Connection | null>(null)

  // Initialize or update the connection when the network changes
  useEffect(() => {
    const endpoint = NETWORK_ENDPOINTS[currentNetwork]
    const newConnection = new Connection(endpoint)
    setConnection(newConnection)
    console.log(`Network changed to ${currentNetwork}, endpoint: ${endpoint}`)
  }, [currentNetwork])

  // Update the address when wallet changes
  useEffect(() => {
    if (publicKey) {
      setAddress(publicKey.toString())
    } else {
      setAddress(null)
    }
  }, [publicKey])

  // Fetch balance when address or connection changes
  const fetchBalance = useCallback(async () => {
    if (!address || !connection || !publicKey) {
      setBalance(null)
      return
    }

    try {
      const balanceInLamports = await connection.getBalance(publicKey)
      setBalance(balanceInLamports / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalance(null)
    }
  }, [address, connection, publicKey])

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchBalance()
    } finally {
      setIsLoading(false)
    }
  }, [fetchBalance])

  // Fetch balance when connected
  useEffect(() => {
    if (connected && publicKey && connection) {
      fetchBalance()
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, connection, fetchBalance])

  // Connect wallet
  const connect = useCallback(async () => {
    console.log('Connecting wallet...')
    setIsLoading(true)

    try {
      // Show wallet modal if no wallet is selected
      if (!wallet) {
        // If Phantom wallet is available, select it
        const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom')
        if (phantomWallet) {
          select(phantomWallet.adapter.name)
        } else if (wallets.length > 0) {
          // Otherwise select the first available wallet
          select(wallets[0].adapter.name)
        }
      }
      console.log('Wallet connection initiated')
    } catch (error) {
      console.error('Error connecting wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }, [wallet, wallets, select])

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setIsLoading(true)
    try {
      await walletDisconnect()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }, [walletDisconnect])

  // Switch network
  const switchNetwork = useCallback((newNetwork: NetworkType) => {
    setCurrentNetwork(newNetwork)
  }, [])

  // Sign message
  const signMessage = useCallback(
    async (message: string) => {
      if (!connected || !walletSignMessage) {
        throw new Error('Wallet not connected or does not support message signing')
      }

      try {
        const encodedMessage = new TextEncoder().encode(message)
        const signature = await walletSignMessage(encodedMessage)
        return Buffer.from(signature).toString('base64')
      } catch (error) {
        console.error('Error signing message:', error)
        throw error
      }
    },
    [connected, walletSignMessage]
  )

  // Send transaction
  const sendTransaction = useCallback(
    async (recipient: string, amount: number) => {
      if (!connected || !publicKey || !connection) {
        throw new Error('Wallet not connected')
      }

      try {
        // Validate recipient address
        const recipientPubkey = new PublicKey(recipient)

        // Validate amount
        if (amount <= 0) {
          throw new Error('Amount must be greater than 0')
        }

        // Check if balance is sufficient
        if (balance !== null && amount > balance) {
          throw new Error('Insufficient balance')
        }

        // Create transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports: amount * LAMPORTS_PER_SOL
          })
        )

        // Get latest blockhash
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        // Sign and send transaction
        const signature = await walletSendTransaction(transaction, connection)

        // Refresh balance after sending
        setTimeout(() => {
          fetchBalance().catch(console.error)
        }, 2000)

        return { hash: signature }
      } catch (error) {
        console.error('Error sending transaction:', error)
        throw error
      }
    },
    [connected, publicKey, connection, balance, walletSendTransaction, fetchBalance]
  )

  return {
    address,
    balance,
    network: currentNetwork,
    isConnected: connected,
    isLoading: isLoading || connecting,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
    sendTransaction,
    refreshBalance
  }
}
