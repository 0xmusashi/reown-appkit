import {
  WalletAccountError,
  WalletSendTransactionError,
  WalletSignMessageError,
  WalletSignTransactionError,
  isVersionedTransaction
} from '@solana/wallet-adapter-base'
import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignInFeature,
  SolanaSignMessage,
  type SolanaSignMessageFeature,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature
} from '@solana/wallet-standard-features'
import { getCommitment } from '@solana/wallet-standard-util'
import type { Connection, SendOptions } from '@solana/web3.js'
import { PublicKey, SendTransactionError, SystemProgram, Transaction, VersionedTransaction } from '@solana/web3.js'
import type { Wallet, WalletAccount, WalletWithFeatures } from '@wallet-standard/base'
import {
  StandardConnect,
  type StandardConnectFeature,
  StandardDisconnect,
  type StandardDisconnectFeature,
  StandardEvents,
  type StandardEventsFeature
} from '@wallet-standard/features'
import base58 from 'bs58'

import { type CaipNetwork, ConstantsUtil } from '@nedykit/appkit-common'
import type { RequestArguments } from '@nedykit/appkit-controllers'
import type { Provider as CoreProvider } from '@nedykit/appkit-controllers'
import { PresetsUtil } from '@nedykit/appkit-utils'
import type {
  AnyTransaction,
  GetActiveChain,
  Provider as SolanaProvider
} from '@nedykit/appkit-utils/solana'

import { solanaChains } from '../utils/chains.js'
import { WalletStandardFeatureNotSupportedError } from './shared/Errors.js'
import { ProviderEventEmitter } from './shared/ProviderEventEmitter.js'
import { getRelayerService, initRelayerService } from '../utils/relayerService.js'
import { RELAYER_URL, RELAYER_SPL_MARGIN, RELAYER_SPL_TOKEN_PRICE_INFO } from './constants.js'

import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getMint,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token'
import Decimal from 'decimal.js'

export interface WalletStandardProviderConfig {
  wallet: Wallet
  getActiveChain: GetActiveChain
  requestedChains: CaipNetwork[]
}

type AvailableFeatures = StandardConnectFeature &
  SolanaSignAndSendTransactionFeature &
  SolanaSignTransactionFeature &
  StandardDisconnectFeature &
  SolanaSignMessageFeature &
  SolanaSignInFeature &
  StandardEventsFeature

export class WalletStandardProvider extends ProviderEventEmitter implements SolanaProvider {
  readonly wallet: Wallet
  readonly getActiveChain: WalletStandardProviderConfig['getActiveChain']
  readonly chain = ConstantsUtil.CHAIN.SOLANA
  public readonly provider = this as CoreProvider

  private readonly requestedChains: WalletStandardProviderConfig['requestedChains']

  constructor({ wallet, getActiveChain, requestedChains }: WalletStandardProviderConfig) {
    super()

    this.wallet = wallet
    this.getActiveChain = getActiveChain
    this.requestedChains = requestedChains

    this.bindEvents()
  }

  // -- Public ------------------------------------------- //
  public get id() {
    const name = this.name

    return PresetsUtil.ConnectorExplorerIds[name] || name
  }

  public get name() {
    if (this.wallet.name === 'Trust') {
      // The wallets from our list of wallets have not matching with the extension name
      return 'Trust Wallet'
    }

    return this.wallet.name
  }

  public get type() {
    return 'ANNOUNCED' as const
  }

  public get explorerId() {
    return PresetsUtil.ConnectorExplorerIds[this.name]
  }

  public get publicKey() {
    const account = this.getAccount(false)

    if (account) {
      return new PublicKey(account.publicKey)
    }

    return undefined
  }

  public get imageUrl() {
    return this.wallet.icon
  }

  public get chains() {
    return this.wallet.chains
      .map(chainId =>
        this.requestedChains.find(
          chain => chain.id === chainId || chain.id === solanaChains[chainId]?.id
        )
      )
      .filter(Boolean) as CaipNetwork[]
  }

  public async connect(): Promise<string> {
    const feature = this.getWalletFeature(StandardConnect)
    await feature.connect()

    const account = this.getAccount(true)
    const publicKey = new PublicKey(account.publicKey)
    this.emit('connect', publicKey)

    return account.address
  }

  public async disconnect() {
    const feature = this.getWalletFeature(StandardDisconnect)

    await feature.disconnect()
    this.emit('disconnect', undefined)
  }

  public async signMessage(message: Uint8Array) {
    const feature = this.getWalletFeature(SolanaSignMessage)
    const account = this.getAccount(true)

    const [result] = await feature.signMessage({ message, account })
    if (!result) {
      throw new WalletSignMessageError('Empty result')
    }

    return result.signature
  }

  public async signTransaction<T extends AnyTransaction>(transaction: T) {
    const feature = this.getWalletFeature(SolanaSignTransaction)
    const account = this.getAccount(true)

    const serializedTransaction = this.serializeTransaction(transaction)

    const [result] = await feature.signTransaction({
      account,
      transaction: new Uint8Array(serializedTransaction),
      chain: this.getActiveChainName()
    })

    if (!result) {
      throw new WalletSignTransactionError('Empty result')
    }

    this.emit('pendingTransaction', undefined)

    if (isVersionedTransaction(transaction)) {
      return VersionedTransaction.deserialize(result.signedTransaction) as T
    }

    return Transaction.from(result.signedTransaction) as T
  }

  public async signAndSendTransaction<T extends AnyTransaction>(
    transaction: T,
    sendOptions?: SendOptions
  ) {
    try {
      const feature = this.getWalletFeature(SolanaSignAndSendTransaction)
      const account = this.getAccount(true)

      const relayerUrl = RELAYER_URL
      initRelayerService(relayerUrl)
      const relayerService = getRelayerService()
      const relayerPublicKey = await relayerService.getRelayerPublicKey()
      if (relayerPublicKey) {
        if (transaction instanceof Transaction) {
          transaction.feePayer = new PublicKey(relayerPublicKey)
        } else if (transaction instanceof VersionedTransaction) {
          const legacyTransaction = Transaction.from(transaction.serialize())
          legacyTransaction.feePayer = new PublicKey(relayerPublicKey)
          transaction = legacyTransaction as T
        }
      }

      const sponsoredTransaction = await relayerService.relayerSignTransaction(transaction as Transaction)

      const [result] = await feature.signAndSendTransaction({
        account,
        transaction: new Uint8Array(this.serializeTransaction(sponsoredTransaction)),
        options: {
          ...sendOptions,
          preflightCommitment: getCommitment(sendOptions?.preflightCommitment)
        },
        chain: this.getActiveChainName()
      })

      if (!result) {
        throw new WalletSendTransactionError('Empty result')
      }

      this.emit('pendingTransaction', undefined)

      return base58.encode(result.signature)
    } catch (error) {
      return ''
    }
  }

  public async signSplTokenPaidTransaction<T extends AnyTransaction>(
    transaction: T,
    token: string, 
    amount: number,
    connection: Connection,
    sendOptions?: SendOptions
  ) {
    const feature = this.getWalletFeature(SolanaSignAndSendTransaction)
    const account = this.getAccount(true)
    const source = account.address
    const tx = transaction as Transaction

    try {
      const relayerUrl = RELAYER_URL
      initRelayerService(relayerUrl)
      const relayerService = getRelayerService()
      const relayerPublicKey = await relayerService.getRelayerPublicKey()
      if (!relayerPublicKey) {
        return ''
      }
      const destination = relayerPublicKey

      const sourcePublicKey = new PublicKey(source)
      const destinationPublicKey = new PublicKey(destination)


      // build SPL token transfer instructions
      const tokenMint = new PublicKey(token)

      let decimals = 9

      if (token !== NATIVE_MINT.toBase58()) {
        const mintData = await getMint(connection, tokenMint)
        decimals = mintData.decimals
      }
      
      const instructions = []

      if (token === NATIVE_MINT.toBase58()) {
        // For SOL transfers (wrapped SOL), use the System Program transfer instruction
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: sourcePublicKey,
            toPubkey: destinationPublicKey,
            lamports: new Decimal(amount).times(Math.pow(10, decimals)).toNumber(),
          })
        )
      } else { 
        // For SPL token transfers
        
        // Get the associated token accounts for source and destination
        const sourceAta = await getAssociatedTokenAddress(
          tokenMint,
          sourcePublicKey,
          false,  // allowOwnerOffCurve
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
        
        const destAta = await getAssociatedTokenAddress(
          tokenMint,
          destinationPublicKey,
          false,  // allowOwnerOffCurve
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
        
        // Check if source token account exists
        const sourceAtaInfo = await connection.getAccountInfo(sourceAta)
        if (!sourceAtaInfo) {
          throw new Error(`Source token account does not exist: ${sourceAta.toBase58()}`)
        }
        
        // Check if destination token account exists, if not create it
        const destAtaInfo = await connection.getAccountInfo(destAta)
        if (!destAtaInfo) {
          // Create associated token account for the destination
          instructions.push(
            createAssociatedTokenAccountInstruction(
              sourcePublicKey,          // Payer
              destAta,                  // Associated token account address
              destinationPublicKey,     // Owner of the associated account
              tokenMint,                // Token mint
              TOKEN_PROGRAM_ID,         // Token program ID
              ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program ID
            )
          )
        }
        
        // Create the transfer instruction
        const transferInstruction = createTransferInstruction(
          sourceAta,                  // Source token account
          destAta,                    // Destination token account
          sourcePublicKey,            // Authority (owner of source account)
          new Decimal(amount).times(Math.pow(10, decimals)).toNumber(), // Amount in base units
          [],                         // Additional signers
          TOKEN_PROGRAM_ID            // Program ID
        )
        
        instructions.push(transferInstruction)
      }
      
      // Add each instruction to the transaction
      for (const instruction of instructions) {
        tx.add(instruction)
      }
      
      // Set fee payer
      tx.feePayer = sourcePublicKey
      
      // Get latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash('confirmed')
      tx.recentBlockhash = latestBlockhash.blockhash

      const sponsoredTransaction = await relayerService.relayerSignSplTokenPaidTransaction(tx, RELAYER_SPL_MARGIN, RELAYER_SPL_TOKEN_PRICE_INFO)
      
      // Send to wallet for signing and sending
      const [result] = await feature.signAndSendTransaction({
        account,
        transaction: new Uint8Array(this.serializeTransaction(sponsoredTransaction)),
        options: {
          ...sendOptions,
          preflightCommitment: getCommitment(sendOptions?.preflightCommitment)
        },
        chain: this.getActiveChainName()
      })

      if (!result) {
        throw new WalletSendTransactionError('Empty result')
      }

      this.emit('pendingTransaction', undefined)
      return base58.encode(result.signature)
    } catch (error) {
      if (error instanceof SendTransactionError) {
        console.log(await error.getLogs(connection))
      }
      return ''
    }
  }

  public async signAndSendTransferTransaction(
    token: string, 
    source: string, 
    destination: string,
    amount: number,
    connection: Connection,
    sendOptions?: SendOptions
  ) {
    const feature = this.getWalletFeature(SolanaSignAndSendTransaction)
    const account = this.getAccount(true)

    try {
      const relayerUrl = RELAYER_URL
      initRelayerService(relayerUrl)
      const relayerService = getRelayerService()
      const relayerPublicKey = await relayerService.getRelayerPublicKey()

      const sourcePublicKey = new PublicKey(source)
      const destinationPublicKey = new PublicKey(destination)

      // build simple SPL token transfer transaction
      const tokenMint = new PublicKey(token)

      let decimals = 9

      if (token !== NATIVE_MINT.toBase58()) {
        const mintData = await getMint(connection, tokenMint)
        decimals = mintData.decimals
      }
      
      const instructions = []

      if (token === NATIVE_MINT.toBase58()) {
        // For SOL transfers (wrapped SOL), use the System Program transfer instruction
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: sourcePublicKey,
            toPubkey: destinationPublicKey,
            lamports: new Decimal(amount).times(Math.pow(10, decimals)).toNumber(),
          })
        )
      } else { 
        // For SPL token transfers
        
        // Get the associated token accounts for source and destination
        const sourceAta = await getAssociatedTokenAddress(
          tokenMint,
          sourcePublicKey,
          false,  // allowOwnerOffCurve
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
        
        const destAta = await getAssociatedTokenAddress(
          tokenMint,
          destinationPublicKey,
          false,  // allowOwnerOffCurve
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
        
        // Check if source token account exists
        const sourceAtaInfo = await connection.getAccountInfo(sourceAta)
        if (!sourceAtaInfo) {
          throw new Error(`Source token account does not exist: ${sourceAta.toBase58()}`)
        }
        
        // Check if destination token account exists, if not create it
        const destAtaInfo = await connection.getAccountInfo(destAta)
        if (!destAtaInfo) {
          // Create associated token account for the destination
          instructions.push(
            createAssociatedTokenAccountInstruction(
              sourcePublicKey,          // Payer
              destAta,                  // Associated token account address
              destinationPublicKey,     // Owner of the associated account
              tokenMint,                // Token mint
              TOKEN_PROGRAM_ID,         // Token program ID
              ASSOCIATED_TOKEN_PROGRAM_ID // Associated token program ID
            )
          )
        }
        
        // Create the transfer instruction
        const transferInstruction = createTransferInstruction(
          sourceAta,                  // Source token account
          destAta,                    // Destination token account
          sourcePublicKey,            // Authority (owner of source account)
          new Decimal(amount).times(Math.pow(10, decimals)).toNumber(), // Amount in base units
          [],                         // Additional signers
          TOKEN_PROGRAM_ID            // Program ID
        )
        
        instructions.push(transferInstruction)
      }

      // Create a new transaction
      let transaction = new Transaction()
      
      // Add each instruction to the transaction
      for (const instruction of instructions) {
        transaction.add(instruction)
      }
      
      // Set fee payer
      transaction.feePayer = sourcePublicKey
      
      // Get latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = latestBlockhash.blockhash

      // If relayer is available, use it for gas sponsorship
      if (relayerPublicKey) {
        try {
          // Change the fee payer to the relayer
          transaction.feePayer = new PublicKey(relayerPublicKey)
          
          // Try to get a sponsored transaction from the relayer
          const sponsoredTransaction = await relayerService.relayerTransferTransaction(token, source, destination, amount, decimals)
          
          if (sponsoredTransaction) {
            transaction = sponsoredTransaction
          }
        } catch (relayerError) {
          transaction.feePayer = sourcePublicKey
        }
      }
      
      // Send to wallet for signing and sending
      const [result] = await feature.signAndSendTransaction({
        account,
        transaction: new Uint8Array(this.serializeTransaction(transaction)),
        options: {
          ...sendOptions,
          preflightCommitment: getCommitment(sendOptions?.preflightCommitment)
        },
        chain: this.getActiveChainName()
      })

      if (!result) {
        throw new WalletSendTransactionError('Empty result')
      }

      this.emit('pendingTransaction', undefined)
      return base58.encode(result.signature)
    } catch (error) {
      if (error instanceof SendTransactionError) {
        console.log(await error.getLogs(connection))
      }
      return ''
    }
  }

  public async sendTransaction(
    transaction: AnyTransaction,
    connection: Connection,
    options?: SendOptions
  ) {
    try {
      const feature = this.getWalletFeature(SolanaSignAndSendTransaction)
      const account = this.getAccount(true)

      const relayerUrl = RELAYER_URL
      initRelayerService(relayerUrl)
      const relayerService = getRelayerService()
      const relayerPublicKey = await relayerService.getRelayerPublicKey()
      if (relayerPublicKey) {
        if (transaction instanceof Transaction) {
          transaction.feePayer = new PublicKey(relayerPublicKey)
        } else if (transaction instanceof VersionedTransaction) {
          const legacyTransaction = Transaction.from(transaction.serialize())
          legacyTransaction.feePayer = new PublicKey(relayerPublicKey)
          transaction = legacyTransaction as Transaction
        }
      }
      if (transaction instanceof Transaction) {
        transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash
      }

      const sponsoredTransaction = await relayerService.relayerSignTransaction(transaction as Transaction)
      
      const [result] = await feature.signAndSendTransaction({
        account,
        transaction: new Uint8Array(this.serializeTransaction(sponsoredTransaction)),
        options: {
          ...options,
          preflightCommitment: getCommitment(options?.preflightCommitment)
        },
        chain: this.getActiveChainName()
      })

      if (!result) {
        throw new WalletSendTransactionError('Empty result')
      }

      this.emit('pendingTransaction', undefined)

      return base58.encode(result.signature)
    } catch (error) {
      return ''
    }
  }

  public async signAllTransactions<T extends AnyTransaction[]>(transactions: T): Promise<T> {
    const feature = this.getWalletFeature(SolanaSignTransaction)

    const account = this.getAccount(true)
    const chain = this.getActiveChainName()

    const result = await feature.signTransaction(
      ...transactions.map(transaction => ({
        transaction: new Uint8Array(this.serializeTransaction(transaction)),
        account,
        chain
      }))
    )

    return result.map(({ signedTransaction }, index) => {
      const transaction = transactions[index]

      if (!transaction) {
        throw new WalletSignTransactionError('Invalid transaction signature response')
      }

      this.emit('pendingTransaction', undefined)

      if (isVersionedTransaction(transaction)) {
        return VersionedTransaction.deserialize(signedTransaction)
      }

      return Transaction.from(signedTransaction)
    }) as T
  }

  public async request<T>(_args: RequestArguments): Promise<T> {
    return Promise.reject(new WalletStandardFeatureNotSupportedError('request'))
  }

  public async getAccounts() {
    return Promise.resolve(
      this.wallet.accounts.map(account => ({
        namespace: this.chain,
        address: account.address,
        type: 'eoa' as const
      }))
    )
  }

  // -- Private ------------------------------------------- //
  private serializeTransaction(transaction: AnyTransaction) {
    return transaction.serialize({ verifySignatures: false })
  }

  private getAccount<Required extends boolean>(
    required?: Required
  ): Required extends true ? WalletAccount : WalletAccount | undefined {
    const account = this.wallet.accounts[0]
    if (required && !account) {
      throw new WalletAccountError()
    }

    return account as Required extends true ? WalletAccount : WalletAccount | undefined
  }

  private getWalletFeature<Name extends keyof AvailableFeatures>(feature: Name) {
    if (!(feature in this.wallet.features)) {
      throw new WalletStandardFeatureNotSupportedError(feature)
    }

    return this.wallet.features[feature] as WalletWithFeatures<
      Record<Name, AvailableFeatures[Name]>
    >['features'][Name]
  }

  private getActiveChainName() {
    const entry = Object.entries(solanaChains).find(
      ([, chain]) => chain.id === this.getActiveChain()?.id
    )

    if (!entry) {
      throw new Error('Invalid chain id')
    }

    return entry[0] as `${string}:${string}`
  }

  private bindEvents() {
    const features = this.getWalletFeature(StandardEvents)

    features.on('change', params => {
      if (params.accounts) {
        const account = params.accounts[0]

        if (account) {
          this.emit('accountsChanged', new PublicKey(account.publicKey))
        }
      }
    })
  }
}
