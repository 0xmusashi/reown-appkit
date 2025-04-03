import React, { useEffect, useMemo, useState } from 'react'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

import AccountInfo from './components/AccountInfo'
import NetworkSelect from './components/NetworkSelect'
import SendTransaction from './components/SendTransaction'
import SignMessage from './components/SignMessage'
import { NetworkType } from './hooks/useSolana'
import { useSolanaWallet } from './hooks/useSolanaWallet'
import { WalletContextProvider } from './wallet-adapter'

// Map our NetworkType to WalletAdapterNetwork
const networkMapping: Record<NetworkType, WalletAdapterNetwork> = {
  'mainnet-beta': WalletAdapterNetwork.Mainnet,
  testnet: WalletAdapterNetwork.Testnet,
  devnet: WalletAdapterNetwork.Devnet
}

const AppContent: React.FC = () => {
  const [enableGasSponsorship, setEnableGasSponsorship] = useState(true)
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkType>('devnet')

  const {
    address,
    balance,
    isConnected,
    isLoading,
    network,
    connect,
    disconnect,
    switchNetwork,
    signMessage,
    sendTransaction,
    refreshBalance
  } = useSolanaWallet(selectedNetwork, enableGasSponsorship)

  // Handle network change
  const handleNetworkChange = (newNetwork: NetworkType) => {
    setSelectedNetwork(newNetwork)
    switchNetwork(newNetwork)
  }

  // Add debug logs to help troubleshoot
  useEffect(() => {
    console.log('App state changed:', {
      address,
      balance,
      isConnected,
      isLoading,
      network
    })
  }, [address, balance, isConnected, isLoading, network])

  // Create a wrapper for connect to add additional logging
  const handleConnect = async () => {
    console.log('Connect button clicked')
    try {
      await connect()
      console.log('Connect function completed')
    } catch (err) {
      console.error('Error in connect handler:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 text-solana-green">Solana Gas Sponsorship Demo</h1>
          <p className="text-gray-400 mb-6">
            Connect your wallet and interact with the Solana blockchain with sponsored transactions
          </p>

          <div className="mb-4 flex items-center justify-center space-x-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-solana-green"
                checked={enableGasSponsorship}
                onChange={e => setEnableGasSponsorship(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-300">Enable Gas Sponsorship</span>
            </label>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <AccountInfo
              address={address}
              balance={balance}
              isConnected={isConnected}
              onConnect={handleConnect}
              onDisconnect={disconnect}
              onRefreshBalance={refreshBalance}
              isLoading={isLoading}
            />

            <NetworkSelect currentNetwork={network} onNetworkChange={handleNetworkChange} />
          </div>

          <div className="space-y-6">
            <SignMessage onSign={signMessage} isConnected={isConnected} />

            <SendTransaction
              onSend={sendTransaction}
              isConnected={isConnected}
              enableGasSponsorship={enableGasSponsorship}
            />
          </div>
        </div>

        <footer className="mt-10 text-center text-gray-500 text-sm">
          <p>Built as a demo for Solana gas-sponsored transactions</p>
        </footer>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const [network, setNetwork] = useState<NetworkType>('devnet')

  // Convert our NetworkType to WalletAdapterNetwork
  const walletNetwork = useMemo(() => networkMapping[network], [network])

  return (
    <WalletContextProvider network={walletNetwork}>
      <AppContent />
    </WalletContextProvider>
  )
}

export default App
