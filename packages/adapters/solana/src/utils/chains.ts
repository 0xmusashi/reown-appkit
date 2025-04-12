import { type CaipNetwork } from '@nedykit/appkit-common'
import { solana, solanaDevnet, solanaTestnet } from '@nedykit/appkit/networks'

export const solanaChains = {
  'solana:mainnet': solana,
  'solana:testnet': solanaTestnet,
  'solana:devnet': solanaDevnet
} as Record<`${string}:${string}`, CaipNetwork>
