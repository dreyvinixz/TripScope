import { describe, expect, it } from 'vitest'
import { buildTravelContext } from '../../services/travelContext'
import type { Destination } from '../../types/destination'
import type { Location } from '../../types/location'
import type { WeatherReport } from '../../types/weather'
import type { Country } from '../../types/country'
import type { CurrencyQuote } from '../../types/currency'

const location: Location = {
  id: 1, city: 'Porto Alegre', region: 'Rio Grande do Sul', country: 'Brasil', countryCode: 'BR',
  latitude: -30.03, longitude: -51.23, timezone: 'America/Sao_Paulo',
}

const weather: WeatherReport = {
  observedAt: '2026-09-19T12:00:00Z',
  current: { temperatureCelsius: 18, apparentTemperatureCelsius: 17, relativeHumidityPercent: 60, windSpeedKmh: 10, weatherCode: 1 },
  daily: [
    { date: '2026-09-19', minimumTemperatureCelsius: 12, maximumTemperatureCelsius: 22, precipitationProbabilityPercent: 10, weatherCode: 1 },
    { date: '2026-09-20', minimumTemperatureCelsius: 13, maximumTemperatureCelsius: 23, precipitationProbabilityPercent: 80, weatherCode: 61 },
  ],
}

const country: Country = {
  officialName: 'República Federativa do Brasil', commonName: 'Brasil', countryCode: 'BR',
  flagUrl: 'https://flagcdn.com/br.svg', capital: 'Brasília', population: 203_000_000,
  primaryLanguage: 'Português',
  currency: { code: 'BRL', name: 'Real brasileiro', symbol: 'R$' },
  currencies: [{ code: 'BRL', name: 'Real brasileiro', symbol: 'R$' }],
  timezones: ['America/Sao_Paulo'],
}

const currencyQuote: CurrencyQuote = { baseCurrency: 'BRL', targetCurrency: 'USD', rate: 0.19, quotedAt: '2026-09-19' }

function destination(overrides: Partial<Destination> = {}): Destination {
  return {
    location,
    weather: { status: 'success', data: weather },
    country: { status: 'success', data: country },
    currency: { status: 'success', data: currencyQuote },
    ...overrides,
  }
}

describe('buildTravelContext', () => {
  it('maps all fields when every resource has loaded successfully', () => {
    const context = buildTravelContext(destination())

    expect(context.location).toEqual(location)
    expect(context.forecast).toEqual(weather.daily)
    expect(context.currencyQuote).toEqual(currencyQuote)
    expect(context.country).toEqual({
      officialName: country.officialName,
      capital: country.capital,
      languages: country.primaryLanguage,
      currencies: ['BRL'],
    })
  })

  it('returns an empty forecast when weather is still loading', () => {
    const context = buildTravelContext(destination({ weather: { status: 'loading' } }))
    expect(context.forecast).toEqual([])
  })

  it('returns an empty forecast when weather failed to load', () => {
    const context = buildTravelContext(destination({ weather: { status: 'error', message: 'falhou' } }))
    expect(context.forecast).toEqual([])
  })

  it('returns a null currency quote when currency is still loading', () => {
    const context = buildTravelContext(destination({ currency: { status: 'loading' } }))
    expect(context.currencyQuote).toBeNull()
  })

  it('returns a null currency quote when currency failed to load', () => {
    const context = buildTravelContext(destination({ currency: { status: 'error', message: 'falhou' } }))
    expect(context.currencyQuote).toBeNull()
  })

  it('returns null country info when country is still loading', () => {
    const context = buildTravelContext(destination({ country: { status: 'loading' } }))
    expect(context.country).toBeNull()
  })

  it('returns null country info when country failed to load', () => {
    const context = buildTravelContext(destination({ country: { status: 'error', message: 'falhou' } }))
    expect(context.country).toBeNull()
  })

  it('maps multiple currencies to their codes only, preserving order', () => {
    const multiCurrencyCountry: Country = {
      ...country,
      currencies: [
        { code: 'BRL', name: 'Real brasileiro' },
        { code: 'USD', name: 'Dólar americano' },
      ],
    }
    const context = buildTravelContext(destination({ country: { status: 'success', data: multiCurrencyCountry } }))
    expect(context.country?.currencies).toEqual(['BRL', 'USD'])
  })
})
