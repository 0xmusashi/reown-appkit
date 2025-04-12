# Upgrading to Solana Adapter with Gas Sponsorship

This guide will help you upgrade an existing project to use the gas sponsorship feature in the Solana adapter.

## 1. Build the Adapter with Gas Sponsorship

First, you need to build the adapter with gas sponsorship support:

```bash
# Clone the repository if you haven't already
git clone https://github.com/reown-com/appkit.git
cd appkit

# Install dependencies
pnpm install

# Build the Solana adapter with gas sponsorship
cd packages/adapters/solana
pnpm run build:with-gas-sponsorship
```

## 2. Install the Modified Adapter

You can either copy the built adapter to your project or link it locally.

### Option 1: Copy the Built Adapter

Copy the built adapter from `packages/adapters/solana/dist` to your project:

```bash
# From the appkit repository
cp -r packages/adapters/solana/dist /path/to/your/project/node_modules/@nedykit/adapters-solana/
```

### Option 2: Link Locally

Alternatively, you can link the package locally for development:

```bash
# From the appkit/packages/adapters/solana directory
npm link

# Then, in your project directory
npm link @nedykit/adapters-solana
```

## 3. Update Your Code

Update your code to use the gas sponsorship feature:

```typescript
// Before
import { SolanaAdapter } from '@nedykit/adapters-solana'

const solanaAdapter = new SolanaAdapter({
  connectionSettings: 'confirmed',
  wallets: [...], // your wallet adapters
})

// After
import { SolanaAdapter } from '@nedykit/adapters-solana'

const solanaAdapter = new SolanaAdapter({
  connectionSettings: 'confirmed',
  wallets: [...], // your wallet adapters
  relayerUrl: 'https://your-relayer-service.com/api/sponsor',
  enableGasSponsorship: true,
})
```

## 4. Set Up Your Relayer Service

You'll need to set up a relayer service that will sponsor gas fees for your users. Your relayer API should:

1. Accept POST requests with a serialized transaction in base64 format
2. Process the transaction to add gas sponsorship information
3. Return the modified transaction in base64 format

Example API endpoint:

```
POST https://your-relayer-service.com/api/sponsor
Content-Type: application/json

{
  "transaction": "base64EncodedSerializedTransaction"
}
```

Example Response:

```json
{
  "transaction": "base64EncodedSerializedSponsoredTransaction"
}
```

## 5. Testing

Test the gas sponsorship feature:

1. Make sure your relayer service is running and accessible
2. Initiate a transaction from your dApp
3. Confirm that the transaction is sent to the relayer service
4. Verify that the user doesn't pay gas fees

## 6. Fallback Mechanism

The adapter includes a fallback mechanism that will use the original transaction flow (where the user pays gas fees) if the relayer service is unavailable. This ensures that transactions can still be processed even if the relayer is down.

## 7. Advanced Configuration

You can customize the adapter behavior with additional options:

```typescript
const solanaAdapter = new SolanaAdapter({
  connectionSettings: 'processed', // Solana commitment level
  wallets: [...], // your wallet adapters
  relayerUrl: 'https://your-relayer-service.com/api/sponsor',
  enableGasSponsorship: true, // Enable or disable gas sponsorship
})
```

## 8. Troubleshooting

If you encounter issues:

- Check that your relayer service is accessible and properly configured
- Verify that the transactions are being correctly serialized and deserialized
- Check the browser console for any error messages from the adapter
- Ensure that your relayer API is returning the expected response format

For further assistance, please open an issue on the [Reown AppKit GitHub repository](https://github.com/reown-com/appkit/issues).
