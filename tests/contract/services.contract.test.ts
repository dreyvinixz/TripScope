import { describe, expect, it } from 'vitest'
import { searchLocations } from '../../src/services/geocodingService'
import { getWeather } from '../../src/services/weatherService'
import { getCountry } from '../../src/services/countryService'
import { getCurrencyQuote } from '../../src/services/currencyService'

describe('contratos opcionais contra APIs públicas', () => {
  it('compõe localização, clima, país e câmbio reais para Tokyo', async () => {
    const [location] = await searchLocations('Tokyo')
    expect(typeof location.city).toBe('string')
    expect(location.countryCode).toBe('JP')
    expect(typeof location.timezone).toBe('string')

    const [weather, country] = await Promise.all([getWeather(location), getCountry(location.countryCode)])
    expect(weather.daily).toHaveLength(5)
    expect(country.countryCode).toBe('JP')

    const currencyCode = country.currency?.code
    expect(currencyCode).toBeTruthy()
    await expect(getCurrencyQuote(currencyCode)).resolves.toMatchObject({ baseCurrency: 'BRL', targetCurrency: currencyCode })
  }, 30_000)
})
