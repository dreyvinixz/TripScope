import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Country } from '../../src/types/country'
import type { CurrencyQuote } from '../../src/types/currency'
import type { Location } from '../../src/types/location'
import type { WeatherReport } from '../../src/types/weather'
import { ServiceError } from '../../src/services/httpClient'
import { getCountry } from '../../src/services/countryService'
import { getCurrencyQuote } from '../../src/services/currencyService'
import { searchLocations } from '../../src/services/geocodingService'
import { getWeather } from '../../src/services/weatherService'
import { useDestination } from '../../src/hooks/useDestination'

vi.mock('../../src/services/geocodingService', () => ({ searchLocations: vi.fn() }))
vi.mock('../../src/services/weatherService', () => ({ getWeather: vi.fn() }))
vi.mock('../../src/services/countryService', () => ({ getCountry: vi.fn() }))
vi.mock('../../src/services/currencyService', () => ({ getCurrencyQuote: vi.fn() }))

const searchMock = vi.mocked(searchLocations)
const weatherMock = vi.mocked(getWeather)
const countryMock = vi.mocked(getCountry)
const currencyMock = vi.mocked(getCurrencyQuote)

const tokyo: Location = {
  id: 1, city: 'Tokyo', region: 'Tokyo', country: 'Japan', countryCode: 'JP',
  latitude: 35.68, longitude: 139.69, timezone: 'Asia/Tokyo',
}
const paris: Location = {
  id: 2, city: 'Paris', region: 'Île-de-France', country: 'France', countryCode: 'FR',
  latitude: 48.85, longitude: 2.35, timezone: 'Europe/Paris',
}
const weather: WeatherReport = {
  observedAt: '2026-09-18T12:00',
  current: { temperatureCelsius: 24, apparentTemperatureCelsius: 25, relativeHumidityPercent: 60, windSpeedKmh: 8, weatherCode: 1 },
  daily: [1, 2, 3, 4, 5].map((day) => ({
    date: `2026-09-${String(17 + day).padStart(2, '0')}`,
    minimumTemperatureCelsius: 18, maximumTemperatureCelsius: 26,
    precipitationProbabilityPercent: 10, weatherCode: 1,
  })),
}
const country: Country = {
  officialName: 'Japan', commonName: 'Japan', countryCode: 'JP', flagUrl: 'https://flagcdn.com/jp.svg',
  capital: 'Tokyo', population: 100, primaryLanguage: 'Japanese',
  currency: { code: 'JPY', name: 'Japanese yen', symbol: '¥' },
  currencies: [{ code: 'JPY', name: 'Japanese yen', symbol: '¥' }], timezones: ['UTC+09:00'],
}
const countryWithoutCurrency: Country = { ...country, countryCode: 'FR', officialName: 'France', commonName: 'France', currency: null, currencies: [] }
const quote: CurrencyQuote = { baseCurrency: 'BRL', targetCurrency: 'JPY', rate: 29, quotedAt: '2026-09-18' }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
  searchMock.mockResolvedValue([tokyo])
  weatherMock.mockResolvedValue(weather)
  countryMock.mockResolvedValue(country)
  currencyMock.mockResolvedValue(quote)
})

afterEach(() => vi.restoreAllMocks())

describe('useDestination', () => {
  it('normaliza a busca e resolve geocodificação antes dos serviços dependentes', async () => {
    const calls: string[] = []
    searchMock.mockImplementation((city) => { calls.push(`geocode:${city}`); return Promise.resolve([tokyo]) })
    weatherMock.mockImplementation(() => { calls.push('weather'); return Promise.resolve(weather) })
    countryMock.mockImplementation(() => { calls.push('country'); return Promise.resolve(country) })

    const { result } = renderHook(() => useDestination())
    await act(async () => { await result.current.search('  Tokyo  ') })

    expect(calls[0]).toBe('geocode:Tokyo')
    expect(calls).toContain('weather')
    expect(calls).toContain('country')
    expect(result.current.destination?.weather.status).toBe('success')
    expect(result.current.destination?.country.status).toBe('success')
    expect(result.current.destination?.currency.status).toBe('success')
  })

  it('não consulta câmbio quando o país não informa moeda compatível', async () => {
    countryMock.mockResolvedValue(countryWithoutCurrency)
    const { result } = renderHook(() => useDestination())

    await act(async () => { await result.current.search('Paris') })

    expect(currencyMock).not.toHaveBeenCalled()
    expect(result.current.destination?.currency).toEqual({
      status: 'error', message: 'Câmbio indisponível: este país não informa uma moeda compatível.',
    })
  })

  it('preserva país e câmbio quando o clima falha', async () => {
    weatherMock.mockRejectedValue(new ServiceError('timeout'))
    const { result } = renderHook(() => useDestination())

    await act(async () => { await result.current.search('Tokyo') })

    expect(result.current.destination?.weather).toEqual({
      status: 'error', message: 'O serviço demorou para responder. Tente obter o clima novamente.',
    })
    expect(result.current.destination?.country.status).toBe('success')
    expect(result.current.destination?.currency.status).toBe('success')
  })

  it('rejeita entrada inválida sem chamar a geocodificação', async () => {
    const { result } = renderHook(() => useDestination())

    await act(async () => { await result.current.search('  ') })

    expect(searchMock).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Não encontramos esse destino.')
    expect(result.current.loading).toBe(false)
  })

  it('cancela a busca anterior e ignora sua resposta tardia', async () => {
    const first = deferred<Location[]>()
    const second = deferred<Location[]>()
    searchMock.mockImplementation((city) => city === 'Tokyo' ? first.promise : second.promise)

    const { result } = renderHook(() => useDestination())
    let firstSearch!: Promise<void>
    let secondSearch!: Promise<void>
    act(() => { firstSearch = result.current.search('Tokyo') })
    await waitFor(() => expect(searchMock).toHaveBeenCalledTimes(1))
    const firstSignal = searchMock.mock.calls[0][1]

    act(() => { secondSearch = result.current.search('Paris') })
    await waitFor(() => expect(searchMock).toHaveBeenCalledTimes(2))
    expect(firstSignal?.aborted).toBe(true)

    second.resolve([paris])
    await act(async () => { await secondSearch })
    expect(result.current.destination?.location.city).toBe('Paris')

    first.resolve([tokyo])
    await act(async () => { await firstSearch })
    expect(result.current.destination?.location.city).toBe('Paris')
  })
})
