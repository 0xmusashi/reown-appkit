import React, { useState } from 'react'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

interface AccountInfoProps {
  address: string | null
  balance: number | null
  isConnected: boolean
  onConnect: () => void
  onDisconnect: () => void
  onRefreshBalance: () => void
  isLoading: boolean
}

const AccountInfo: React.FC<AccountInfoProps> = ({
  address,
  balance,
  isConnected,
  onConnect,
  onDisconnect,
  onRefreshBalance,
  isLoading
}) => {
  const [localIsLoading, setLocalIsLoading] = useState(false)

  const handleConnect = async () => {
    setLocalIsLoading(true)
    try {
      await onConnect()
    } catch (error) {
      console.error('Error connecting:', error)
    } finally {
      setLocalIsLoading(false)
    }
  }

  // Use the local loading state or the prop from parent
  const buttonDisabled = isLoading || localIsLoading

  return (
    <div className="card mb-6">
      <h2 className="text-xl font-bold mb-4">Account</h2>

      {!isConnected ? (
        <div className="flex justify-center">
          <WalletMultiButton />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Address</label>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-900 p-2 rounded text-sm flex-1 overflow-hidden text-ellipsis">
                {address}
              </code>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  if (address) navigator.clipboard.writeText(address)
                }}
                title="Copy address"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Balance</label>
            <div className="flex items-center space-x-2">
              <div className="bg-gray-900 p-2 rounded text-sm flex-1">
                {balance !== null ? `${balance.toFixed(6)} SOL` : 'Loading...'}
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={onRefreshBalance}
                disabled={buttonDisabled}
                title="Refresh balance"
              >
                Refresh
              </button>
            </div>
          </div>

          <button
            className="btn btn-outline w-full"
            onClick={onDisconnect}
            disabled={buttonDisabled}
          >
            Disconnect
          </button>
        </>
      )}
    </div>
  )
}

export default AccountInfo
