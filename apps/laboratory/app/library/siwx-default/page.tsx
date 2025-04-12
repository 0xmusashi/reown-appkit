'use client'

import { HuobiWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

import { EthersAdapter } from '@nedykit/appkit-adapter-ethers'
import { SolanaAdapter } from '@nedykit/appkit-adapter-solana'
import { DefaultSIWX } from '@nedykit/appkit-siwx'
import { mainnet } from '@nedykit/appkit/networks'
import { createAppKit, useAppKitNetwork } from '@nedykit/appkit/react'

import { AppKitButtons } from '@/src/components/AppKitButtons'
import { AppKitInfo } from '@/src/components/AppKitInfo'
import { DefaultSIWXStatus } from '@/src/components/DefaultSIWXStatus'
import { EthersTests } from '@/src/components/Ethers/EthersTests'
import { SolanaTests } from '@/src/components/Solana/SolanaTests'
import { ConstantsUtil } from '@/src/utils/ConstantsUtil'
import { ThemeStore } from '@/src/utils/StoreUtil'

const networks = ConstantsUtil.AllNetworks

const etherAdapter = new EthersAdapter()

const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new HuobiWalletAdapter(), new SolflareWalletAdapter()]
})

const modal = createAppKit({
  adapters: [solanaWeb3JsAdapter, etherAdapter],
  projectId: ConstantsUtil.ProjectId,
  networks,
  defaultNetwork: mainnet,
  features: {
    analytics: true
  },
  termsConditionsUrl: 'https://reown.com/terms-of-service',
  privacyPolicyUrl: 'https://reown.com/privacy-policy',
  siwx: new DefaultSIWX()
})

ThemeStore.setModal(modal)

export default function SIWXDefault() {
  const { caipNetwork } = useAppKitNetwork()

  return (
    <>
      <AppKitButtons />
      <AppKitInfo />
      <DefaultSIWXStatus />

      {caipNetwork?.chainNamespace === 'eip155' && <EthersTests />}
      {caipNetwork?.chainNamespace === 'solana' && <SolanaTests />}
    </>
  )
}
