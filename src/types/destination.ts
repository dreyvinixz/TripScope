import type { Location } from './location'
import type { Country } from './country'
import type { CurrencyQuote } from './currency'
import type { WeatherReport } from './weather'
export type Resource<T> = { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; message: string }
export interface Destination {
  location: Location
  weather: Resource<WeatherReport>
  country: Resource<Country>
  currency: Resource<CurrencyQuote>
}
