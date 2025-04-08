import { Program } from '@coral-xyz/anchor'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'

import { IDL } from './idl'

const programId = new PublicKey('NZqPEssvQPTGo31JGNzE1P2PhysusspkrGPbJaqKWTN')

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

// Initialize the program interface with the IDL, program ID, and connection.
// Using 'any' to bypass type checking issues with the IDL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const program = new Program<any>(IDL as any, programId, {
  connection
})

// Derive a PDA for the counter account, using "counter" as the seed.
// We'll use this to update the counter on-chain.
export const [counterPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('counter')],
  program.programId
)

// Define a TypeScript type for the Counter data structure
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CounterData = any
