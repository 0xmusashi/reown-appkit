# Solana Gas Sponsorship Demo

A simple React application demonstrating how to implement gas sponsorship for Solana transactions.

## Features

- Connect to Solana wallet (simulated for demo)
- Toggle gas sponsorship on/off
- View account balance and network information
- Sign messages
- Send transactions with or without gas sponsorship
- Support for multiple networks (Mainnet, Testnet, Devnet)

## Running the Demo

1. Install dependencies

   ```
   npm install
   ```

2. Start the development server

   ```
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## How It Works

This demo implements a custom React hook (`useSolana`) that simulates wallet connections and blockchain interactions. It demonstrates how gas sponsorship would work in a real application by:

1. Toggling gas sponsorship with a checkbox
2. Showing when gas sponsorship is enabled
3. Demonstrating the effect on transaction fees (in a real app, the fees would be paid by the sponsoring service)

## Implementation Details

- The demo uses a mock implementation to simulate blockchain interactions
- In a real application, you would use the Solana web3.js library and a real wallet adapter
- Gas sponsorship would be implemented through a relayer service that pays for the transaction fees

## Next Steps

To implement real gas sponsorship:

1. Set up a relayer service that can sign and submit transactions
2. Create an API endpoint to receive transaction requests
3. Have the relayer pay for the gas fees on behalf of users
