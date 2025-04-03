import React, { useState } from 'react'

interface SignMessageProps {
  onSign: (message: string) => Promise<string>
  isConnected: boolean
}

const SignMessage: React.FC<SignMessageProps> = ({ onSign, isConnected }) => {
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSign = async () => {
    if (!message) return

    setIsLoading(true)
    setError(null)
    setSignature(null)

    try {
      const sig = await onSign(message)
      setSignature(sig)
    } catch (err) {
      console.error('Error signing message:', err)
      setError('Failed to sign message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Sign Message</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Message</label>
        <textarea
          className="input w-full h-24"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Enter a message to sign"
          disabled={!isConnected || isLoading}
        />
      </div>

      <button
        className="btn btn-primary mb-4"
        onClick={handleSign}
        disabled={!isConnected || !message || isLoading}
      >
        {isLoading ? 'Signing...' : 'Sign Message'}
      </button>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {signature && (
        <div>
          <h3 className="text-lg font-medium mb-2">Signature</h3>
          <div className="bg-gray-900 p-3 rounded overflow-auto break-all text-xs">{signature}</div>
        </div>
      )}
    </div>
  )
}

export default SignMessage
