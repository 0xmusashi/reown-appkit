import React, { useState } from 'react'

interface SendTransactionProps {
  onSend: (recipient: string, amount: number) => Promise<{ hash: string }>
  isConnected: boolean
  enableGasSponsorship: boolean
}

const SendTransaction: React.FC<SendTransactionProps> = ({
  onSend,
  isConnected,
  enableGasSponsorship
}) => {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!recipient || !amount) return

    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      const { hash } = await onSend(recipient, parseFloat(amount))
      setTxHash(hash)
    } catch (err) {
      console.error('Error sending transaction:', err)
      setError('Failed to send transaction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Send Transaction</h2>

      {enableGasSponsorship && (
        <div className="bg-green-900 text-green-100 p-3 rounded-lg mb-4 text-sm">
          🎉 Gas sponsorship is enabled! Transaction fees will be covered.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Recipient Address</label>
        <input
          type="text"
          className="input w-full"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="Enter recipient Solana address"
          disabled={!isConnected || isLoading}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
        <input
          type="number"
          className="input w-full"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.01"
          min="0.000001"
          step="0.000001"
          disabled={!isConnected || isLoading}
        />
      </div>

      <button
        className="btn btn-primary mb-4"
        onClick={handleSend}
        disabled={!isConnected || !recipient || !amount || isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Transaction'}
      </button>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {txHash && (
        <div>
          <h3 className="text-lg font-medium mb-2">Transaction Hash</h3>
          <div className="bg-gray-900 p-3 rounded overflow-auto break-all text-xs">{txHash}</div>
          <div className="mt-2">
            <a
              href={`https://explorer.solana.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View on Solana Explorer →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default SendTransaction
