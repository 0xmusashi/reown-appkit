import { Transaction } from '@solana/web3.js'

/**
 * Service to interact with a gas sponsorship relayer API
 */
export class RelayerService {
  private readonly relayerUrl: string

  constructor(relayerUrl: string) {
    this.relayerUrl = relayerUrl
  }

  /**
   * Submit a transaction to the relayer for gas sponsorship
   * @param transaction The transaction to be sponsored
   * @returns A new transaction with gas sponsorship information
   */
  public async sponsorTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      // Serialize the transaction to send to the relayer API
      const serializedTransaction = transaction
        .serialize({
          requireAllSignatures: false,
          verifySignatures: false
        })
        .toString('base64')

      // Call the relayer API
      const response = await fetch(this.relayerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transaction: serializedTransaction })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Relayer API error: ${response.status} - ${errorData.message || 'Unknown error'}`
        )
      }

      // Parse the response
      const responseData = await response.json()

      // Deserialize the sponsored transaction from the response
      const sponsoredTransaction = Transaction.from(Buffer.from(responseData.transaction, 'base64'))

      return sponsoredTransaction
    } catch (error) {
      console.error('Error sponsoring transaction:', error)
      throw error
    }
  }
}

// Singleton instance for the relayer service
let relayerServiceInstance: RelayerService | null = null

/**
 * Initialize the relayer service with the API URL
 * @param relayerUrl The URL of the relayer API
 */
export function initRelayerService(relayerUrl: string): void {
  relayerServiceInstance = new RelayerService(relayerUrl)
}

/**
 * Get the relayer service instance
 * @returns The relayer service instance
 * @throws Error if the relayer service is not initialized
 */
export function getRelayerService(): RelayerService {
  if (!relayerServiceInstance) {
    throw new Error('Relayer service not initialized. Call initRelayerService first.')
  }
  return relayerServiceInstance
}
