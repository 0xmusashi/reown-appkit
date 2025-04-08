import { useState } from 'react'

import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import { sha256 } from 'js-sha256'

const endpoint = `https://api.devnet.solana.com`
const COUNTER_PROGRAM = 'NZqPEssvQPTGo31JGNzE1P2PhysusspkrGPbJaqKWTN'
const COUNTER_ACCOUNT = '9NTqfJgad8ntebHsoTDjuCnuysZANX2PBeFMQFBNJjVu'

export default function IncrementButton() {
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [signature, setSignature] = useState('')

  const connection = new Connection(endpoint, 'processed')

  const onClick = async () => {
    if (!publicKey || !sendTransaction || !signTransaction) return

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
          pubkey: publicKey,
          isSigner: true,
          isWritable: false
        }
      ]

      const instruction = new TransactionInstruction({
        keys,
        programId: new PublicKey(programId),
        data // The instruction data containing the discriminator.
      })

      transaction.add(instruction)

      const { blockhash } = await connection.getLatestBlockhash('finalized')
      transaction.recentBlockhash = blockhash

      const signature = await sendTransaction(transaction, connection)
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
      <button style={{ width: '240px' }} onClick={onClick} disabled={!publicKey}>
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
