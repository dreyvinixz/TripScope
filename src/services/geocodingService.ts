import { z } from 'zod'
import type { Location } from '../types/location'
import { normalizeCityInput } from '../utils/validation'
import { parseResponse, requestJson, ServiceError } from './httpClient'
export const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const locationDto = z.object({
  id: z.number().int(), name: z.string().min(1), country: z.string().min(1),
  country_code: z.string().regex(/^[A-Za-z]{2}$/), latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180), timezone: z.string().min(1), admin1: z.string().optional(),
  feature_code: z.string().optional(), population: z.number().nonnegative().optional(),
})
const preferredCountryByCity: Record<string, string> = {
  tokyo: 'JP', paris: 'FR', london: 'GB', 'new york': 'US', 'rio grande': 'BR', 'sao paulo': 'BR',
}
function comparable(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}
function rankLocation(item: z.infer<typeof locationDto>, query: string): number {
  const normalizedQuery = comparable(query)
  const exactName = comparable(item.name) === normalizedQuery
  const preferredCountry = preferredCountryByCity[normalizedQuery] === item.country_code.toUpperCase()
  const isUrbanCenter = item.feature_code === 'PPLC' || item.feature_code?.startsWith('PPLA')
  return (preferredCountry ? 10_000 : 0) + (exactName ? 1_000 : 0) + (isUrbanCenter ? 100 : 0) + Math.min(item.population ?? 0, 50_000_000) / 1_000_000
}
export function normalizeLocations(data: unknown): Location[] {
  return parseLocationResults(data).map(item => ({ id: item.id, city: item.name, country: item.country,
    countryCode: item.country_code.toUpperCase(), latitude: item.latitude, longitude: item.longitude,
    timezone: item.timezone, region: item.admin1 ?? '' }))
}
function parseLocationResults(data: unknown): z.infer<typeof locationDto>[] {
  const { results } = parseResponse(z.object({ results: z.array(z.unknown()).optional() }), data)
  const validResults = (results ?? []).flatMap(item => {
    const parsed = locationDto.safeParse(item)
    return parsed.success ? [parsed.data] : []
  })
  if (results?.length && !validResults.length) throw new ServiceError('unexpected-response')
  return validResults
}
export async function searchLocations(city: string, signal?: AbortSignal, countryCode?: string): Promise<Location[]> {
  const query = normalizeCityInput(city)
  if (query.length < 2 || query.length > 100) throw new ServiceError('not-found')
  const url = new URL(GEOCODING_API_URL)
  const params = new URLSearchParams({ name: query, count: '8', language: 'pt', format: 'json' })
  if (countryCode) params.set('countryCode', countryCode.trim().toUpperCase())
  url.search = params.toString()
  const payload = await requestJson(url, { signal })
  const countryFilter = countryCode?.trim().toUpperCase()
  const ordered = parseLocationResults(payload)
    .filter(item => !countryFilter || item.country_code.toUpperCase() === countryFilter)
    .sort((a, b) => rankLocation(b, query) - rankLocation(a, query))
  const preferredCountry = preferredCountryByCity[comparable(query)]
  const preferred = preferredCountry ? ordered.filter(item => item.country_code.toUpperCase() === preferredCountry) : []
  const results = (preferred.length > 0 ? preferred : ordered).map(item => ({ id: item.id, city: item.name, country: item.country,
    countryCode: item.country_code.toUpperCase(), latitude: item.latitude, longitude: item.longitude,
    timezone: item.timezone, region: item.admin1 ?? '' }))
  if (!results.length) throw new ServiceError('not-found')
  return results
}
