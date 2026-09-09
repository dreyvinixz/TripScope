import { z } from 'zod'
import type { CurrencyQuote } from '../types/currency'
import { parseResponse, requestJson, ServiceError } from './httpClient'
export const CURRENCY_API_URL = 'https://api.frankfurter.dev/v1'
const quoteDto = z.object({ base: z.literal('BRL'), date: z.iso.date(), rates: z.record(z.string(), z.number().positive()) })
export function normalizeQuote(data: unknown, target: string): CurrencyQuote {
  const quote = parseResponse(quoteDto, data)
  const rate = quote.rates[target]
  if (!rate) throw new ServiceError('unsupported-currency')
  return { baseCurrency: 'BRL', targetCurrency: target, rate, quotedAt: quote.date }
}
export async function getCurrencyQuote(target: string | undefined, signal?: AbortSignal): Promise<CurrencyQuote> {
  if (!target || !/^[A-Z]{3}$/.test(target)) throw new ServiceError('unsupported-currency')
  if (target === 'BRL') return { baseCurrency: 'BRL', targetCurrency: 'BRL', rate: 1, quotedAt: new Date().toISOString().slice(0, 10) }
  const currencies = parseResponse(z.record(z.string(), z.string()), await requestJson(`${CURRENCY_API_URL}/currencies`, { signal }))
  if (!currencies[target]) throw new ServiceError('unsupported-currency')
  return normalizeQuote(await requestJson(`${CURRENCY_API_URL}/latest?base=BRL&symbols=${target}`, { signal }), target)
}
