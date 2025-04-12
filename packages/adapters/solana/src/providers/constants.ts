export const RELAYER_URL = 'http://localhost:4000/api/v1'
export const RELAYER_SPL_MARGIN = 0.01
export const RELAYER_SPL_TOKEN_PRICE_INFO = {
  // use fixed price now, use auto-fetch jup price in relayer service later
  price: 1000000000, // 1 token = 1 SOL (decimals = 9)
}
