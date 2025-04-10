import { Transaction } from '@solana/web3.js'
import axios from 'axios'
import bs58 from 'bs58'
import Decimal from 'decimal.js'

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
  public async relayerSignTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      // Serialize the transaction to send to the relayer API
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      // Encode the serialized transaction into Base58
      const base58EncodedTransaction = bs58.encode(serializedTransaction)

      // Call the relayer API
      try {
        const response = await axios.post(`${this.relayerUrl}/nedy/signTransaction`, {transaction: base58EncodedTransaction})
  
        const sponsoredTransaction = Transaction.from(bs58.decode(response.data.data.signedTransaction))
  
        return sponsoredTransaction
      } catch (error) {
        return transaction;
      }
    } catch (error) {
      return transaction;
    }
  }

  public async relayerTransferTransaction(
    token: string, 
    source: string, 
    destination: string,
    amount: number,
    decimals: number
  ): Promise<Transaction | null> {
    try {
      const transferAmount = new Decimal(amount).mul(new Decimal(10).pow(decimals)).toNumber()
      const response = await axios.post(`${this.relayerUrl}/nedy/transferTransaction`, {token, source, destination, amount: transferAmount})
      return Transaction.from(bs58.decode(response.data.data.transaction))
    } catch (error) {
      return null
    }
  }

  public async relayerSignAndSendTransaction(transaction: Transaction): Promise<string> {
    try {
      // Serialize the transaction to send to the relayer API
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      const base58EncodedTransaction = bs58.encode(serializedTransaction)
      const response = await axios.post(`${this.relayerUrl}/nedy/signAndSendTransaction`, {transaction: base58EncodedTransaction})
      return response.data.data.signature
    } catch (error) {
      return ''
    }
  }

  public async relayerGetTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      const base58EncodedTransaction = bs58.encode(serializedTransaction)
      const response = await axios.post(`${this.relayerUrl}/nedy/estimateTransactionFee`, {transaction: base58EncodedTransaction})
      return response.data.data.feeInLamports
    } catch (error) {
      return 0
    }
  }

  public async getRelayerPublicKey(): Promise<string> {
    try {
      const response = await axios.get(`${this.relayerUrl}/relayers/`)
      return response.data.data.relayerPublicKey
    } catch (error) {
      return ''
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
