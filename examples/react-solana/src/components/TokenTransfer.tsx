import { useState } from 'react'

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";

import type { Provider } from "@reown/appkit-adapter-solana";
import { Connection } from '@solana/web3.js';
const TOKEN_MINT = 'BomroFd4tDAGmSRcNCt7TZLkeaeH815KYzfCpSTjHSfP'
const endpoint = `https://api.devnet.solana.com`

export default function TokenTransfer() {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const connection = new Connection(endpoint, 'confirmed')

  const [recipient, setRecipient] = useState('2grKcZPjxKbNKkc8S6nmrSXtXTXJih4utVMa7jBwRcFf');
  const [amount, setAmount] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false)
  const [signature, setSignature] = useState('')

  const onClick = async () => {
    if (!address || !walletProvider.signAndSendTransferTransaction) return

    setIsLoading(true)

    try {
      const signature = await walletProvider.signAndSendTransferTransaction(TOKEN_MINT, address, recipient, amount, 9, connection)
      setSignature(`https://explorer.solana.com/tx/${signature.toString()}?cluster=devnet`)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <p style={{ marginBottom: '10px', fontSize: '16px', fontWeight: 'bold' }}>Token Transfer</p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <input style={{ marginBottom: '10px', width: '240px', backgroundColor: 'white', padding: '10px', borderRadius: '5px', color: 'black' }} type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient" />
      <input style={{ marginBottom: '10px', width: '240px', backgroundColor: 'white', padding: '10px', borderRadius: '5px', color: 'black' }} type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Amount" />
      <button style={{ width: '240px', cursor: 'pointer' }} onClick={onClick} disabled={!address}>
          {isLoading ? 'Loading' : 'Gasless Transfer'}
        </button>
      </div>
      <br />
      {signature && (
        <p>
          Signature:{' '}
          <a href={signature} target="_blank">
            {signature}
          </a>
        </p>
      )}
    </div>
  )
}
