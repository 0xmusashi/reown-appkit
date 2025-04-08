import React, { useEffect, useState } from 'react'

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'

import CounterState from './CounterState'
import IncrementButton from './Increment'

interface CounterProps {
  isConnected: boolean
  publicKey: PublicKey | null
  sendTransaction: (transaction: Transaction) => Promise<string>
}

const Counter: React.FC<CounterProps> = ({ isConnected, publicKey, sendTransaction }) => {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Counter program ID on devnet
  const COUNTER_PROGRAM_ID = new PublicKey('CounterYrUCxxQgQR8xg9y3V26hjoJK2Nbqf9k4mFaK')

  // Your counter account - this is derived for each user
  const [counterAccount, setCounterAccount] = useState<PublicKey | null>(null)

  // Connection to Solana devnet
  const connection = new Connection('https://api.devnet.solana.com')

  useEffect(() => {
    if (isConnected && publicKey) {
      // Derive a counter PDA for the connected wallet
      try {
        const seeds = [publicKey.toBuffer()]
        const [pda, _] = PublicKey.findProgramAddressSync(seeds, COUNTER_PROGRAM_ID)
        setCounterAccount(pda)
        fetchCounter(pda)
      } catch (err: unknown) {
        console.error('Error finding counter account:', err)
        setError('Failed to find counter account')
      }
    } else {
      setCounterAccount(null)
      setCount(null)
    }
  }, [isConnected, publicKey])

  const fetchCounter = async (account: PublicKey) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch the account data
      const accountInfo = await connection.getAccountInfo(account)

      if (accountInfo && accountInfo.data.length > 0) {
        // Parse the counter value from the account data
        // The first 8 bytes are usually for the account discriminator
        // and the counter is stored as a u64 (8 bytes)
        const counterValue = accountInfo.data.readBigUInt64LE(8)
        setCount(Number(counterValue))
      } else {
        setCount(null)
      }
    } catch (err: unknown) {
      console.error('Error fetching counter:', err)
      setError('Failed to fetch counter value')
      setCount(null)
    } finally {
      setLoading(false)
    }
  }

  const incrementCounter = async () => {
    if (!isConnected || !publicKey || !counterAccount) {
      setError('Wallet not connected')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Create an instruction to call the increment method on the Counter program
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: counterAccount, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false }
        ],
        programId: COUNTER_PROGRAM_ID,
        data: Buffer.from([0]) // 0 = increment instruction
      })

      // Create and send the transaction
      const transaction = new Transaction().add(instruction)
      const signature = await sendTransaction(transaction)

      console.log('Transaction sent:', signature)

      // Wait for confirmation and refresh counter
      await connection.confirmTransaction(signature)
      fetchCounter(counterAccount)
    } catch (err: unknown) {
      console.error('Error incrementing counter:', err)
      setError(`Failed to increment counter: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-solana-green mb-4">Counter Program</h2>

      {!isConnected ? (
        <p className="text-gray-400 mb-4">
          Connect your wallet to interact with the Counter program
        </p>
      ) : (
        <>
          <div className="mb-4">
            <CounterState />
          </div>

          <IncrementButton />

          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        </>
      )}
    </div>
  )
}

export default Counter
