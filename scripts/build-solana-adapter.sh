#!/bin/bash

# This script applies the gas sponsorship feature to the Solana adapter

echo "Adding gas sponsorship to Solana adapter..."

# Go to the project root
cd "$(dirname "$0")/.."

# Navigate to the Solana adapter directory
cd packages/adapters/solana

# Make sure we have a clean dist directory
echo "Cleaning dist directory..."
pnpm run build:clean

# Create the relayer service
echo "Creating relayer service..."
cat > src/utils/relayerService.ts << EOL
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
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      }).toString('base64')

      // Call the relayer API
      const response = await fetch(this.relayerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction: serializedTransaction }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(\`Relayer API error: \${response.status} - \${errorData.message || 'Unknown error'}\`)
      }

      // Parse the response
      const responseData = await response.json()
      
      // Deserialize the sponsored transaction from the response
      const sponsoredTransaction = Transaction.from(
        Buffer.from(responseData.transaction, 'base64')
      )

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
EOL

# Backup original files
echo "Backing up original files..."
cp src/client.ts src/client.ts.bak
cp src/index.ts src/index.ts.bak

# Update the index.ts file
echo "Updating index.ts..."
cat > src/index.ts << EOL
import '@reown/appkit-polyfills'

export { SolanaAdapter } from './client.js'
export { RelayerService, initRelayerService, getRelayerService } from './utils/relayerService.js'

// -- Types -----------------------------------------------------------
export type { AdapterOptions } from './client.js'
export type * from '@solana/wallet-adapter-base'
export type * from './utils/SolanaStoreUtil.js'
EOL

# Update client.ts
echo "Updating client.ts..."
cat > src/client.ts << EOL
import type { BaseWalletAdapter } from '@solana/wallet-adapter-base'
import type { Commitment, ConnectionConfig } from '@solana/web3.js'
import { Connection, PublicKey } from '@solana/web3.js'
import UniversalProvider from '@walletconnect/universal-provider'
import bs58 from 'bs58'

import { type AppKit, type AppKitOptions } from '@reown/appkit'
import { type CaipNetwork, ConstantsUtil as CommonConstantsUtil } from '@reown/appkit-common'
import {
  AlertController,
  ChainController,
  CoreHelperUtil,
  type Provider as CoreProvider,
  StorageUtil
} from '@reown/appkit-controllers'
import { ErrorUtil } from '@reown/appkit-utils'
import { SolConstantsUtil } from '@reown/appkit-utils/solana'
import type { Provider as SolanaProvider } from '@reown/appkit-utils/solana'
import { W3mFrameProvider } from '@reown/appkit-wallet'
import { AdapterBlueprint } from '@reown/appkit/adapters'

import { AuthProvider } from './providers/AuthProvider.js'
import {
  CoinbaseWalletProvider,
  type SolanaCoinbaseWallet
} from './providers/CoinbaseWalletProvider.js'
import { SolanaWalletConnectProvider } from './providers/SolanaWalletConnectProvider.js'
import { SolStoreUtil } from './utils/SolanaStoreUtil.js'
import { createSendTransaction } from './utils/createSendTransaction.js'
import { getRelayerService, initRelayerService } from './utils/relayerService.js'
import { watchStandard } from './utils/watchStandard.js'

export interface AdapterOptions {
  connectionSettings?: Commitment | ConnectionConfig
  wallets?: BaseWalletAdapter[]
  relayerUrl?: string
  enableGasSponsorship?: boolean
}

export class SolanaAdapter extends AdapterBlueprint<SolanaProvider> {
  private connectionSettings: Commitment | ConnectionConfig
  public wallets?: BaseWalletAdapter[]
  private balancePromises: Record<string, Promise<AdapterBlueprint.GetBalanceResult>> = {}
  private enableGasSponsorship: boolean = false

  constructor(options: AdapterOptions = {}) {
    super({
      adapterType: CommonConstantsUtil.ADAPTER_TYPES.SOLANA,
      namespace: CommonConstantsUtil.CHAIN.SOLANA
    })
    this.connectionSettings = options.connectionSettings || 'confirmed'
    this.wallets = options.wallets
    this.enableGasSponsorship = options.enableGasSponsorship || false

    // Initialize the relayer service if gas sponsorship is enabled and a relayer URL is provided
    if (this.enableGasSponsorship && options.relayerUrl) {
      initRelayerService(options.relayerUrl)
    }
  }

  public override construct(params: AdapterBlueprint.Params): void {
    super.construct(params)
    const connectedCaipNetwork = StorageUtil.getActiveCaipNetworkId()
    const caipNetwork =
      params.networks?.find(n => n.caipNetworkId === connectedCaipNetwork) || params.networks?.[0]
    const rpcUrl = caipNetwork?.rpcUrls.default.http[0] as string
    if (rpcUrl) {
      SolStoreUtil.setConnection(new Connection(rpcUrl, this.connectionSettings))
    }
  }

  public override setAuthProvider(w3mFrameProvider: W3mFrameProvider) {
    this.addConnector(
      new AuthProvider({
        w3mFrameProvider,
        getActiveChain: () => ChainController.getCaipNetworkByNamespace(this.namespace),
        chains: this.caipNetworks as CaipNetwork[]
      })
    )
  }

  override syncConnectors(options: AppKitOptions, appKit: AppKit) {
    if (!options.projectId) {
      AlertController.open(ErrorUtil.ALERT_ERRORS.PROJECT_ID_NOT_CONFIGURED, 'error')
    }

    const getActiveChain = () => appKit.getCaipNetwork(this.namespace)

    // Add Coinbase Wallet if available
    if (CoreHelperUtil.isClient() && 'coinbaseSolana' in window) {
      this.addConnector(
        new CoinbaseWalletProvider({
          provider: window.coinbaseSolana as SolanaCoinbaseWallet,
          chains: this.caipNetworks as CaipNetwork[],
          getActiveChain
        })
      )
    }

    // Watch for standard wallet adapters
    watchStandard(this.caipNetworks as CaipNetwork[], getActiveChain, this.addConnector.bind(this))
  }

  // -- Transaction methods ---------------------------------------------------
  /**
   *
   * These methods are supported only on \`wagmi\` and \`ethers\` since the Solana SDK does not support them in the same way.
   * These function definition is to have a type parity between the clients. Currently not in use.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async getEnsAddress(
    params: AdapterBlueprint.GetEnsAddressParams
  ): Promise<AdapterBlueprint.GetEnsAddressResult> {
    return { address: params.name }
  }

  public async writeContract(): Promise<AdapterBlueprint.WriteContractResult> {
    return Promise.resolve({
      hash: ''
    })
  }

  public async getCapabilities(): Promise<unknown> {
    return Promise.resolve({})
  }

  public async grantPermissions(): Promise<unknown> {
    return Promise.resolve({})
  }

  public async revokePermissions(): Promise<\`0x\${string}\`> {
    return Promise.resolve('0x')
  }

  public override async walletGetAssets(
    _params: AdapterBlueprint.WalletGetAssetsParams
  ): Promise<AdapterBlueprint.WalletGetAssetsResponse> {
    return Promise.resolve({})
  }

  public async getAccounts(
    params: AdapterBlueprint.GetAccountsParams
  ): Promise<AdapterBlueprint.GetAccountsResult> {
    const connector = this.connectors.find(c => c.id === params.id)
    if (!connector) {
      return { accounts: [] }
    }

    return { accounts: await connector.getAccounts() }
  }

  public async signMessage(
    params: AdapterBlueprint.SignMessageParams
  ): Promise<AdapterBlueprint.SignMessageResult> {
    const provider = params.provider as SolanaProvider
    if (!provider) {
      throw new Error('connectionControllerClient:signMessage - provider is undefined')
    }

    const signature = await provider.signMessage(new TextEncoder().encode(params.message))

    return {
      signature: bs58.encode(signature)
    }
  }

  public async estimateGas(
    params: AdapterBlueprint.EstimateGasTransactionArgs
  ): Promise<AdapterBlueprint.EstimateGasTransactionResult> {
    const connection = SolStoreUtil.state.connection

    if (!connection || !params.provider) {
      throw new Error('Connection is not set')
    }

    const transaction = await createSendTransaction({
      provider: params.provider as SolanaProvider,
      connection,
      to: '11111111111111111111111111111111',
      value: 1
    })

    const fee = await transaction.getEstimatedFee(connection)

    return {
      gas: BigInt(fee || 0)
    }
  }

  public async sendTransaction(
    params: AdapterBlueprint.SendTransactionParams
  ): Promise<AdapterBlueprint.SendTransactionResult> {
    const connection = SolStoreUtil.state.connection

    if (!connection || !params.address || !params.provider) {
      throw new Error('Connection is not set')
    }

    const provider = params.provider as SolanaProvider

    const transaction = await createSendTransaction({
      provider,
      connection,
      to: params.to,
      value: params.value as number
    })

    // Apply gas sponsorship if enabled
    let transactionToSend = transaction

    try {
      if (this.enableGasSponsorship) {
        const relayerService = getRelayerService()
        transactionToSend = await relayerService.sponsorTransaction(transaction)
      }
    } catch (error) {
      console.error('Error sponsoring transaction, falling back to original transaction:', error)
      // Fall back to the original transaction if sponsorship fails
      transactionToSend = transaction
    }

    const result = await provider.sendTransaction(transactionToSend, connection)

    await new Promise<void>(resolve => {
      const interval = setInterval(async () => {
        const status = await connection.getSignatureStatus(result)

        if (status?.value) {
          clearInterval(interval)
          resolve()
        }
      }, 1000)
    })

    return {
      hash: result
    }
  }

  public parseUnits(): bigint {
    return 0n
  }

  public formatUnits(): string {
    return ''
  }

  public async connect(
    params: AdapterBlueprint.ConnectParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    const connector = this.connectors.find(c => c.id === params.id)

    if (!connector) {
      throw new Error('Provider not found')
    }

    const rpcUrl =
      params.rpcUrl ||
      this.caipNetworks?.find(n => n.id === params.chainId)?.rpcUrls.default.http[0]

    if (!rpcUrl) {
      throw new Error(\`RPC URL not found for chainId: \${params.chainId}\`)
    }

    const address = await connector.connect({
      chainId: params.chainId as string
    })
    this.listenProviderEvents(connector)

    SolStoreUtil.setConnection(new Connection(rpcUrl, this.connectionSettings))

    return {
      id: connector.id,
      address,
      chainId: params.chainId as string,
      provider: connector as CoreProvider,
      type: connector.type
    }
  }

  public async getBalance(
    params: AdapterBlueprint.GetBalanceParams
  ): Promise<AdapterBlueprint.GetBalanceResult> {
    const address = params.address
    const caipNetwork = this.caipNetworks?.find(network => network.id === params.chainId)

    if (!address) {
      return Promise.resolve({ balance: '0.00', symbol: 'SOL' })
    }

    const connection = new Connection(
      caipNetwork?.rpcUrls?.default?.http?.[0] as string,
      this.connectionSettings
    )

    const caipAddress = \`\${caipNetwork?.caipNetworkId}:\${params.address}\`
    const cachedPromise = this.balancePromises[caipAddress]
    if (cachedPromise) {
      return cachedPromise
    }
    const cachedBalance = StorageUtil.getNativeBalanceCacheForCaipAddress(caipAddress)
    if (cachedBalance) {
      return { balance: cachedBalance.balance, symbol: cachedBalance.symbol }
    }
    this.balancePromises[caipAddress] = new Promise<AdapterBlueprint.GetBalanceResult>(
      async resolve => {
        try {
          const balance = await connection.getBalance(new PublicKey(address))
          const formattedBalance = (balance / SolConstantsUtil.LAMPORTS_PER_SOL).toString()

          StorageUtil.updateNativeBalanceCache({
            caipAddress,
            balance: formattedBalance,
            symbol: params.caipNetwork?.nativeCurrency.symbol || 'SOL',
            timestamp: Date.now()
          })

          if (!params.caipNetwork) {
            throw new Error('caipNetwork is required')
          }

          resolve({
            balance: formattedBalance,
            symbol: params.caipNetwork?.nativeCurrency.symbol
          })
        } catch (error) {
          resolve({ balance: '0.00', symbol: 'SOL' })
        }
      }
    ).finally(() => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.balancePromises[caipAddress]
    })

    return this.balancePromises[caipAddress] || { balance: '0.00', symbol: 'SOL' }
  }

  public override async switchNetwork(params: AdapterBlueprint.SwitchNetworkParams): Promise<void> {
    await super.switchNetwork(params)

    const { caipNetwork } = params

    if (caipNetwork?.rpcUrls?.default?.http?.[0]) {
      SolStoreUtil.setConnection(
        new Connection(caipNetwork.rpcUrls.default.http[0], this.connectionSettings)
      )
    }
  }

  private listenProviderEvents(provider: SolanaProvider) {
    const disconnectHandler = () => {
      this.removeProviderListeners(provider)
      this.emit('disconnect')
    }

    const accountsChangedHandler = (publicKey: PublicKey) => {
      const address = publicKey.toBase58()
      if (address) {
        this.emit('accountChanged', { address })
      }
    }

    provider.on('disconnect', disconnectHandler)
    provider.on('accountsChanged', accountsChangedHandler)
    provider.on('connect', accountsChangedHandler)
    provider.on('pendingTransaction', () => {
      this.emit('pendingTransactions')
    })

    this.providerHandlers = {
      disconnect: disconnectHandler,
      accountsChanged: accountsChangedHandler
    }
  }

  private providerHandlers: {
    disconnect: () => void
    accountsChanged: (publicKey: PublicKey) => void
  } | null = null

  private removeProviderListeners(provider: SolanaProvider) {
    if (this.providerHandlers) {
      provider.removeListener('disconnect', this.providerHandlers.disconnect)
      provider.removeListener('accountsChanged', this.providerHandlers.accountsChanged)
      provider.removeListener('connect', this.providerHandlers.accountsChanged)
      this.providerHandlers = null
    }
  }

  public override setUniversalProvider(universalProvider: UniversalProvider): void {
    this.addConnector(
      new SolanaWalletConnectProvider({
        provider: universalProvider,
        chains: this.caipNetworks as CaipNetwork[],
        getActiveChain: () => ChainController.getCaipNetworkByNamespace(this.namespace)
      })
    )
  }

  public override async connectWalletConnect(chainId?: string | number) {
    const result = await super.connectWalletConnect(chainId)

    const rpcUrl = this.caipNetworks?.find(n => n.id === chainId)?.rpcUrls.default.http[0] as string
    const connection = new Connection(rpcUrl, this.connectionSettings)

    SolStoreUtil.setConnection(connection)

    return result
  }

  public async disconnect(params: AdapterBlueprint.DisconnectParams): Promise<void> {
    if (!params.provider || !params.providerType) {
      throw new Error('Provider or providerType not provided')
    }

    await params.provider.disconnect()
  }

  public async getProfile(): Promise<AdapterBlueprint.GetProfileResult> {
    return Promise.resolve({
      profileName: undefined,
      profileImage: undefined
    })
  }

  public async syncConnection(
    params: AdapterBlueprint.SyncConnectionParams
  ): Promise<AdapterBlueprint.ConnectResult> {
    return this.connect({
      ...params,
      type: ''
    })
  }

  public getWalletConnectProvider(
    params: AdapterBlueprint.GetWalletConnectProviderParams
  ): AdapterBlueprint.GetWalletConnectProviderResult {
    const walletConnectProvider = new SolanaWalletConnectProvider({
      provider: params.provider as UniversalProvider,
      chains: params.caipNetworks,
      getActiveChain: () => ChainController.getCaipNetworkByNamespace(this.namespace)
    })

    return walletConnectProvider as unknown as UniversalProvider
  }
}
EOL

# Now run the build
echo "Building the project..."
pnpm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "Build completed successfully!"
else
  echo "Build failed, restoring original files..."
  mv src/client.ts.bak src/client.ts
  mv src/index.ts.bak src/index.ts
  exit 1
fi

# Cleanup
rm -f src/client.ts.bak src/index.ts.bak

echo "Gas sponsorship has been successfully added to the Solana adapter!"
echo "You can now use the adapter with the following options:"
echo "  relayerUrl: The URL of your relayer API"
echo "  enableGasSponsorship: Set to true to enable gas sponsorship" 