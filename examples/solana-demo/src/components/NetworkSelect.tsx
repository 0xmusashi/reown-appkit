import React from 'react'

import { NetworkType } from '../hooks/useSolana'

interface NetworkSelectProps {
  currentNetwork: NetworkType
  onNetworkChange: (network: NetworkType) => void
}

const NetworkSelect: React.FC<NetworkSelectProps> = ({ currentNetwork, onNetworkChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Network</label>
      <div className="grid grid-cols-3 gap-2">
        <button
          className={`btn ${currentNetwork === 'mainnet-beta' ? 'bg-purple-600' : 'bg-gray-700'} text-white`}
          onClick={() => onNetworkChange('mainnet-beta')}
        >
          Mainnet
        </button>
        <button
          className={`btn ${currentNetwork === 'testnet' ? 'bg-purple-600' : 'bg-gray-700'} text-white`}
          onClick={() => onNetworkChange('testnet')}
        >
          Testnet
        </button>
        <button
          className={`btn ${currentNetwork === 'devnet' ? 'bg-purple-600' : 'bg-gray-700'} text-white`}
          onClick={() => onNetworkChange('devnet')}
        >
          Devnet
        </button>
      </div>
    </div>
  )
}

export default NetworkSelect
