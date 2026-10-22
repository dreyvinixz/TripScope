import { z } from 'zod'
import type { CurrencyQuote } from '../types/currency'
import { parseResponse, requestJson, ServiceError } from './httpClient'
export const CURRENCY_API_URL = 'https://api.frankfurter.dev/v1'
const quoteDto = z.object({ base: z.literal('BRL'), date: z.iso.date(), rates: z.record(z.string(), z.number().positive()) })
export function normalizeQuote(data: unknown, target: string): CurrencyQuote {
  const quote = parseResponse(quoteDto, data)
  const normalizedTarget = target.trim().toUpperCase()
  const rate = quote.rates[normalizedTarget]
  if (!rate) throw new ServiceError('unsupported-currency')
  return { baseCurrency: 'BRL', targetCurrency: normalizedTarget, rate, quotedAt: quote.date }
}
export async function getCurrencyQuote(target: string | undefined, signal?: AbortSignal): Promise<CurrencyQuote> {
  const normalizedTarget = target?.trim().toUpperCase()
  if (!normalizedTarget || !/^[A-Z]{3}$/.test(normalizedTarget)) throw new ServiceError('unsupported-currency')
  if (normalizedTarget === 'BRL') return { baseCurrency: 'BRL', targetCurrency: 'BRL', rate: 1, quotedAt: new Date().toISOString().slice(0, 10) }
  return normalizeQuote(await requestJson(`${CURRENCY_API_URL}/latest?base=BRL&symbols=${normalizedTarget}`, { signal }), normalizedTarget)
}
