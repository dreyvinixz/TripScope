import countryResponse from '../fixtures/country-response.json'
import sparseCountryResponse from '../fixtures/country-sparse-response.json'
import currencyResponse from '../fixtures/currency-response.json'
import geocodingResponse from '../fixtures/geocoding-response.json'
import weatherResponse from '../fixtures/weather-response.json'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { normalizeLocations, searchLocations } from '../../src/services/geocodingService'
import { normalizeWeather } from '../../src/services/weatherService'
import { getCountry, normalizeCountry } from '../../src/services/countryService'
import { getCurrencyQuote, normalizeQuote } from '../../src/services/currencyService'
import { ServiceError } from '../../src/services/httpClient'

afterEach(() => vi.unstubAllGlobals())

function requestedUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

describe('normalizadores de Web Services', () => {
  it('normaliza a resposta de geocodificação sem expor o DTO externo', () => {
    expect(normalizeLocations(geocodingResponse)).toEqual([{
      id: 1850147,
      city: 'Tokyo',
      region: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      latitude: 35.6895,
      longitude: 139.6917,
      timezone: 'Asia/Tokyo',
    }])
  })

  it('normaliza cidade antes de consultar o endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(geocodingResponse), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await searchLocations('  Tokyo  ')

    expect(requestedUrl(fetchMock.mock.calls[0][0])).toContain('name=Tokyo')
  })

  it('normaliza clima com exatamente cinco previsões', () => {
    const weather = normalizeWeather(weatherResponse)
    expect(weather.daily).toHaveLength(5)
    expect(weather.current.temperatureCelsius).toBe(24.5)
    expect(weather.daily[2].precipitationProbabilityPercent).toBeNull()
    expect(weather).not.toHaveProperty('daily[0].temperature_2m_min')
  })

  it('rejeita payload de clima com quantidade diferente de dias', () => {
    const invalid = structuredClone(weatherResponse)
    invalid.daily.time.pop()
    expect(() => normalizeWeather(invalid)).toThrowError(new ServiceError('unexpected-response'))
  })

  it('normaliza país completo e preserva campos opcionais ausentes', () => {
    const country = normalizeCountry(countryResponse)
    expect(country.currency).toEqual({ code: 'JPY', name: 'Japanese yen', symbol: '¥' })
    expect(country.flagUrl).toBe('https://flagcdn.com/jp.svg')

    const sparse = normalizeCountry(sparseCountryResponse)
    expect(sparse.capital).toBeNull()
    expect(sparse.primaryLanguage).toBeNull()
    expect(sparse.currency).toBeNull()
    expect(sparse.currencies).toEqual([])
  })

  it('consulta país por ISO normalizado', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(countryResponse), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const country = await getCountry(' jp ')

    expect(country.countryCode).toBe('JP')
    expect(requestedUrl(fetchMock.mock.calls[0][0])).toContain('/alpha/JP?')
  })

  it('normaliza cotação BRL para moeda do destino', () => {
    expect(normalizeQuote(currencyResponse, 'jpy')).toEqual({
      baseCurrency: 'BRL', targetCurrency: 'JPY', rate: 29.42, quotedAt: '2026-09-18',
    })
  })

  it('consulta moedas suportadas e retorna a cotação interna', async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ JPY: 'Japanese yen' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(currencyResponse), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getCurrencyQuote('jpy')).resolves.toMatchObject({ targetCurrency: 'JPY', rate: 29.42 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('retorna erro conhecido para moeda ausente ou não suportada', async () => {
    await expect(getCurrencyQuote(undefined)).rejects.toMatchObject({ code: 'unsupported-currency' })

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ USD: 'US Dollar' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getCurrencyQuote('JPY')).rejects.toMatchObject({ code: 'unsupported-currency' })
  })
})
