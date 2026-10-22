import { z } from 'zod'
import type { Country } from '../types/country'
import { parseResponse, requestJson, ServiceError } from './httpClient'
export const COUNTRIES_API_URL = 'https://countries.dev'
const countryDto = z.object({
  name: z.string().min(1),
  alpha2Code: z.string().regex(/^[A-Z]{2}$/),
  flags: z.object({ svg: z.string().optional(), png: z.string().optional() }).optional(),
  capital: z.string().nullable().optional(),
  population: z.number().finite().nonnegative(),
  languages: z.array(z.object({ name: z.string().min(1) })).optional(),
  timezones: z.array(z.string()).optional(),
  currencies: z.array(z.object({ code: z.string().regex(/^[A-Z]{3}$/), name: z.string(), symbol: z.string().optional() })).optional(),
})
export function normalizeCountry(data: unknown): Country {
  const item = parseResponse(countryDto, data)
  const currencies = [...(item.currencies ?? [])].sort((a, b) => a.code.localeCompare(b.code))
  const flag = item.flags?.svg ?? item.flags?.png ?? ''
  return { officialName: item.name, commonName: item.name, countryCode: item.alpha2Code,
    flagUrl: /^https:\/\/flagcdn\.com\//.test(flag) ? flag : '', capital: item.capital || null,
    population: item.population, primaryLanguage: item.languages?.map(language => language.name).join(', ') || null,
    currency: currencies[0] ?? null, currencies, timezones: item.timezones ?? [] }
}
export async function getCountry(code: string, signal?: AbortSignal): Promise<Country> {
  const normalizedCode = code.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalizedCode)) throw new ServiceError('not-found')
  const fields = 'name,alpha2Code,flags,capital,population,languages,currencies,timezones'
  const country = normalizeCountry(await requestJson(`${COUNTRIES_API_URL}/alpha/${normalizedCode}?fields=${fields}`, { signal }))
  if (country.countryCode !== normalizedCode) throw new ServiceError('unexpected-response')
  return country
}
