import { useState } from 'react'
import { useAppKitAccount, useAppKitProvider } from "@nedykit/appkit/react";
import type { Provider } from "@nedykit/appkit-adapter-solana";

export function SignMessage() {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSign = async () => {
    if (!message || !address || !walletProvider) return

    setIsLoading(true)
    setSignature('')
    setError('')

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const sig = await walletProvider.signMessage(encodedMessage)
      setSignature(Buffer.from(sig).toString('hex'))
    } catch (err) {
      console.error('Error signing message:', err)
      setError('Failed to sign message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h2>Sign Message</h2>

      <div>
        <label>Message: </label>
        <input
          style={{ marginBottom: '10px', width: '240px', backgroundColor: 'white', padding: '10px', borderRadius: '5px', color: 'black' }} 
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Enter a message to sign"
          disabled={isLoading}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSign}
        disabled={!message || isLoading}
        style={{ cursor: 'pointer' }}
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
