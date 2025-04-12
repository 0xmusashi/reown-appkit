import type { CaipNetwork } from '@nedykit/appkit-common'
import type { Connector } from '@nedykit/appkit-controllers'

export interface ChainAdapterConnector extends Connector {
  chains: CaipNetwork[]
}
