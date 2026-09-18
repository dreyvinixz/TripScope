import type { CurrencyQuote } from '../types/currency'

export function convertBrlToTarget(amount: number, quote: CurrencyQuote): number {
  return amount * quote.rate
}
