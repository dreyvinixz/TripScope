import { z } from 'zod'
import type { Country } from '../types/country'
import { parseResponse, requestJson, ServiceError } from './httpClient'
export const COUNTRIES_API_URL = 'https://restcountries.com/v3.1'
const countryDto = z.object({ name: z.object({ official: z.string().min(1), common: z.string().min(1) }),
  cca2: z.string().regex(/^[A-Z]{2}$/), flags: z.object({ svg: z.string().optional(), png: z.string().optional() }).optional(),
  capital: z.array(z.string()).optional(), population: z.number().nonnegative(),
  languages: z.record(z.string(), z.string()).optional(), timezones: z.array(z.string()).optional(),
  currencies: z.record(z.string(), z.object({ name: z.string(), symbol: z.string().optional() })).optional(),
})
export function normalizeCountry(data: unknown): Country {
  const item = parseResponse(z.array(countryDto).min(1), Array.isArray(data) ? data : [data])[0]
  const currencies = Object.entries(item.currencies ?? {}).sort(([a], [b]) => a.localeCompare(b))
    .filter(([code]) => /^[A-Z]{3}$/.test(code)).map(([code, currency]) => ({ code, ...currency }))
  const flag = item.flags?.svg ?? item.flags?.png ?? ''
  return { officialName: item.name.official, commonName: item.name.common, countryCode: item.cca2,
    flagUrl: /^https:\/\/flagcdn\.com\//.test(flag) ? flag : '', capital: item.capital?.join(', ') || null,
    population: item.population, primaryLanguage: Object.values(item.languages ?? {}).join(', ') || null,
    currency: currencies[0] ?? null, currencies, timezones: item.timezones ?? [] }
}
export async function getCountry(code: string, signal?: AbortSignal): Promise<Country> {
  if (!/^[A-Z]{2}$/.test(code)) throw new ServiceError('unexpected-response')
  const country = normalizeCountry(await requestJson(`${COUNTRIES_API_URL}/alpha/${code}?fields=name,cca2,flags,capital,population,languages,currencies,timezones`, { signal }))
  if (country.countryCode !== code) throw new ServiceError('unexpected-response')
  return country
}
