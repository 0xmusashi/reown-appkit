import React, { FC, ReactNode, useMemo } from 'react'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
// Import the styles for the wallet modal
import '@solana/wallet-adapter-react-ui/styles.css'
import {
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'

export const WalletContextProvider: FC<{ children: ReactNode; network: WalletAdapterNetwork }> = ({
  children,
  network
}) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const endpoint = useMemo(() => clusterApiUrl(network), [network])

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TorusWalletAdapter()
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default WalletContextProvider
