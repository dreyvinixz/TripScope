import { z } from 'zod'
import type { Location } from '../types/location'
import { normalizeCityInput } from '../utils/validation'
import { parseResponse, requestJson, ServiceError } from './httpClient'
export const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const locationDto = z.object({
  id: z.number().int(), name: z.string().min(1), country: z.string().min(1),
  country_code: z.string().regex(/^[A-Za-z]{2}$/), latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180), timezone: z.string().min(1), admin1: z.string().optional(),
})
export function normalizeLocations(data: unknown): Location[] {
  const { results } = parseResponse(z.object({ results: z.array(locationDto).optional() }), data)
  return (results ?? []).map(item => ({ id: item.id, city: item.name, country: item.country,
    countryCode: item.country_code.toUpperCase(), latitude: item.latitude, longitude: item.longitude,
    timezone: item.timezone, region: item.admin1 ?? '' }))
}
export async function searchLocations(city: string, signal?: AbortSignal): Promise<Location[]> {
  const query = normalizeCityInput(city)
  if (query.length < 2 || query.length > 100) throw new ServiceError('not-found')
  const url = new URL(GEOCODING_API_URL)
  url.search = new URLSearchParams({ name: query, count: '8', language: 'pt', format: 'json' }).toString()
  const results = normalizeLocations(await requestJson(url, { signal }))
  if (!results.length) throw new ServiceError('not-found')
  return results
}
