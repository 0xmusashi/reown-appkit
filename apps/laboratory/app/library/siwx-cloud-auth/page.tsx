'use client'

import { EthersAdapter } from '@nedykit/appkit-adapter-ethers'
import { CloudAuthSIWX } from '@nedykit/appkit-siwx'
import { mainnet } from '@nedykit/appkit/networks'
import { createAppKit } from '@nedykit/appkit/react'

import { AppKitButtons } from '@/src/components/AppKitButtons'
import { AppKitInfo } from '@/src/components/AppKitInfo'
import { EthersTests } from '@/src/components/Ethers/EthersTests'
import { SolanaTests } from '@/src/components/Solana/SolanaTests'
import { ConstantsUtil } from '@/src/utils/ConstantsUtil'
import { ThemeStore } from '@/src/utils/StoreUtil'

const networks = ConstantsUtil.EvmNetworks

const etherAdapter = new EthersAdapter()

const modal = createAppKit({
  adapters: [etherAdapter],
  projectId: ConstantsUtil.ProjectId,
  networks,
  defaultNetwork: mainnet,
  features: {
    analytics: true
  },
  termsConditionsUrl: 'https://reown.com/terms-of-service',
  privacyPolicyUrl: 'https://reown.com/privacy-policy',
  siwx: new CloudAuthSIWX()
})

ThemeStore.setModal(modal)

export default function SIWXCloudAuth() {
  return (
    <>
      <AppKitButtons />
      <AppKitInfo />
      <EthersTests />
      <SolanaTests />
    </>
  )
}
