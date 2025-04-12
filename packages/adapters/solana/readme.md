#### 📚 [Documentation](https://docs.reown.com/appkit/overview)

#### 🔗 [Website](https://reown.com/appkit)

# AppKit

Your on-ramp to web3 multichain. AppKit is a versatile library that makes it super easy to connect users with your Dapp and start interacting with the blockchain.

<p align="center">
  <img src="./.github/assets/header.png" alt="" border="0">
</p>

# Solana Adapter for nedy-appkit

This adapter allows integrating Solana blockchain into your dApp using nedy-appkit.

## Installation

```bash
npm install @nedykit/adapters-solana
# or
yarn add @nedykit/adapters-solana
# or
pnpm add @nedykit/adapters-solana
```

## Usage

```typescript
import { SolanaAdapter } from '@nedykit/adapters-solana'

// Create a new instance of the Solana adapter
const solanaAdapter = new SolanaAdapter({
  connectionSettings: 'confirmed',
  wallets: [...], // your wallet adapters
})

// Use with AppKit
const appkit = new AppKit({
  projectId: 'YOUR_PROJECT_ID',
  adapters: [solanaAdapter],
})
```

## Gas Sponsorship for Transactions

This adapter supports gas sponsorship for Solana transactions through a relayer service. This allows your application to cover the gas fees for your users' transactions, providing a better user experience.

### How to Enable Gas Sponsorship

To enable gas sponsorship, you need to initialize the Solana adapter with the following options:

```typescript
import { SolanaAdapter } from '@nedykit/adapters-solana'

// Create a new instance of the Solana adapter with gas sponsorship enabled
const solanaAdapter = new SolanaAdapter({
  connectionSettings: 'confirmed',
  wallets: [...], // your wallet adapters
  relayerUrl: 'https://your-relayer-service.com/api/sponsor',
  enableGasSponsorship: true,
})
```

### How Gas Sponsorship Works

When a user sends a transaction through the adapter:

1. The adapter creates a transaction as usual
2. If gas sponsorship is enabled, the transaction is sent to the relayer API
3. The relayer API adds the sponsorship information to the transaction
4. The modified transaction is then signed by the user and submitted to the network
5. The gas fees are paid by the relayer instead of the user

### Relayer API Requirements

Your relayer API should:

1. Accept POST requests with a serialized transaction in base64 format
2. Process the transaction to add gas sponsorship information
3. Return the modified transaction in base64 format

Example API request/response:

```
// Request
POST /api/sponsor
Content-Type: application/json

{
  "transaction": "base64EncodedSerializedTransaction"
}

// Response
{
  "transaction": "base64EncodedSerializedSponsoredTransaction"
}
```

### Fallback Mechanism

If the relayer service is unavailable or returns an error, the adapter will automatically fall back to the original transaction flow, where the user pays their own gas fees. This ensures that transactions can still be processed even if the relayer service is down.

## Advanced Configuration

You can customize the adapter behavior with the following options:

```typescript
const solanaAdapter = new SolanaAdapter({
  connectionSettings: 'processed', // Solana commitment level
  wallets: [...], // your wallet adapters
  relayerUrl: 'https://your-relayer-service.com/api/sponsor',
  enableGasSponsorship: true, // Enable or disable gas sponsorship
})
```

## Building the Project

### Regular Build

To build the project without gas sponsorship, follow these steps:

```bash
# Install dependencies
pnpm install

# Build the adapter
pnpm run build

# Run tests (optional)
pnpm test
```

### Build with Gas Sponsorship

To build the project with gas sponsorship support:

```bash
# Install dependencies
pnpm install

# Build the adapter with gas sponsorship
pnpm run build:with-gas-sponsorship
```

This will create a custom build with the gas sponsorship feature enabled. The build files will be in the `dist` directory.

## Example

Check the `examples` directory for a sample implementation of the gas sponsorship feature.

To run the example:

```bash
cd examples
pnpm install
pnpm build
```
