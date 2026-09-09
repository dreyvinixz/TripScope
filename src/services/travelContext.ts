import type { Destination } from '../types/destination'
import type { TravelContext } from '../types/travel'
export function buildTravelContext(destination: Destination): TravelContext {
  const country = destination.country.status === 'success' ? destination.country.data : null
  return {
    location: destination.location,
    forecast: destination.weather.status === 'success' ? destination.weather.data.daily : [],
    currencyQuote: destination.currency.status === 'success' ? destination.currency.data : null,
    country: country ? { officialName: country.officialName, capital: country.capital,
      languages: country.primaryLanguage, currencies: country.currencies.map(currency => currency.code) } : null,
  }
}
