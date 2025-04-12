import type { CaipNetwork } from '@nedykit/appkit'
import { ConstantsUtil } from '@nedykit/appkit-common'
import { CaipNetworksUtil } from '@nedykit/appkit-utils'

import {
  base as baseNetwork,
  bitcoin as bitcoinNetwork,
  mainnet as mainnetNetwork,
  polygon as polygonNetwork,
  sepolia as sepoliaNetwork,
  solana as solanaNetwork
} from '../../src/networks/index.js'

const [base, mainnet, polygon, sepolia, solana, bitcoin] = CaipNetworksUtil.extendCaipNetworks(
  [baseNetwork, mainnetNetwork, polygonNetwork, sepoliaNetwork, solanaNetwork, bitcoinNetwork],
  { customNetworkImageUrls: {}, projectId: 'test-project-id' }
) as [CaipNetwork, CaipNetwork, CaipNetwork, CaipNetwork, CaipNetwork, CaipNetwork]

const unsupportedNetwork = {
  chainNamespace: mainnet.chainNamespace,
  id: '123456789',
  caipNetworkId:
    `${mainnet.chainNamespace}:123456789` as `${typeof mainnet.chainNamespace}:${string}`,
  name: ConstantsUtil.UNSUPPORTED_NETWORK_NAME,
  nativeCurrency: {
    name: 'Unknown',
    symbol: 'UNK',
    decimals: 18
  }
} as CaipNetwork

export { base, mainnet, polygon, sepolia, solana, bitcoin, unsupportedNetwork }
