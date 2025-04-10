import { useState } from 'react'

import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { Connection, PublicKey, Transaction, TransactionInstruction, type AccountMeta } from '@solana/web3.js'
import { sha256 } from 'js-sha256'
import type { Provider } from "@reown/appkit-adapter-solana";
const endpoint = `https://api.devnet.solana.com`
const COUNTER_PROGRAM = 'NZqPEssvQPTGo31JGNzE1P2PhysusspkrGPbJaqKWTN'
const COUNTER_ACCOUNT = '9NTqfJgad8ntebHsoTDjuCnuysZANX2PBeFMQFBNJjVu'

export default function IncrementButton() {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  const [isLoading, setIsLoading] = useState(false)
  const [signature, setSignature] = useState('')

  const connection = new Connection(endpoint, 'confirmed')

  const onClick = async () => {
    if (!address || !walletProvider.sendTransaction || !walletProvider.signTransaction) return

    setIsLoading(true)

    try {
      const transaction = new Transaction()

      const programId = new PublicKey(COUNTER_PROGRAM)
      const counterAccount = new PublicKey(COUNTER_ACCOUNT)

      const methodName = 'global:increment'
      const hash = sha256.digest(methodName) // 32-byte hash
      const discriminator = Buffer.from(hash.slice(0, 8)) // First 8 bytes
      const data = discriminator

      const keys = [
        {
          pubkey: new PublicKey(counterAccount),
          isSigner: false,
          isWritable: true
        },
        {
          pubkey: new PublicKey(address),
          isSigner: true,
          isWritable: false
        }
      ]

      const instruction = new TransactionInstruction({
        keys: keys as AccountMeta[],
        programId: new PublicKey(programId),
        data // The instruction data containing the discriminator.
      })

      transaction.add(instruction)

      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      transaction.feePayer = new PublicKey(address)
      // const signature = await walletProvider.signAndSendTransaction(transaction)
      const signature = await walletProvider.sendTransaction(transaction, connection)

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
      <p>Gasless Counter Increment</p>
      <br />
      <button style={{ width: '240px', cursor: 'pointer' }} onClick={onClick} disabled={!address}>
        {isLoading ? 'Loading' : 'Increment'}
      </button>
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
