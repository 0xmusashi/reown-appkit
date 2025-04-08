import { useEffect, useState } from 'react'

import { useConnection } from '@solana/wallet-adapter-react'

import { CounterData, counterPDA, program } from '../anchor/setup'

export default function CounterState() {
  const { connection } = useConnection()
  const [counterData, setCounterData] = useState<CounterData | null>(null)

  useEffect(() => {
    const fetchCounterData = async () => {
      try {
        // Fetch initial account data using a type assertion to handle the program.account structure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await (program as any).account.counter.fetch(counterPDA)
        setCounterData(data as CounterData)
      } catch (error) {
        console.error('Error fetching counter data:', error)
      }
    }

    fetchCounterData()

    // Subscribe to account change
    const subscriptionId = connection.onAccountChange(
      // The address of the account we want to watch
      counterPDA,
      // Callback for when the account changes
      accountInfo => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const decodedData = (program as any).coder.accounts.decode('counter', accountInfo.data)
          setCounterData(decodedData as CounterData)
        } catch (error) {
          console.error('Error decoding account data:', error)
        }
      }
    )

    return () => {
      // Unsubscribe from account change
      connection.removeAccountChangeListener(subscriptionId)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, counterPDA, connection])

  // Safely handle possibly undefined or incorrectly typed data
  const getCount = () => {
    if (!counterData) return '0'

    // Try to access the count property safely
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return String((counterData as any).count || 0)
    } catch (e) {
      return '0'
    }
  }

  // Render the value of the counter with a safe accessor
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <p className="text-lg">Count: {getCount()}</p>
    </div>
  )
}
