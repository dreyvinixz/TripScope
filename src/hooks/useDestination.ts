import { useEffect, useRef, useState } from 'react'
import type { Destination, Resource } from '../types/destination'
import type { Location } from '../types/location'
import { searchLocations } from '../services/geocodingService'
import { getWeather } from '../services/weatherService'
import { getCountry } from '../services/countryService'
import { getCurrencyQuote } from '../services/currencyService'
import { errorMessage } from '../services/httpClient'

export function useDestination() {
  const [destination, setDestination] = useState<Destination | null>(null)
  const [matches, setMatches] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  function begin() {
    controller.current?.abort()
    const active = new AbortController()
    controller.current = active
    setError(''); setMatches([]); setDestination(null)
    return active.signal
  }
  async function load(location: Location, signal: AbortSignal) {
    setLoading(false); setMatches([])
    setDestination({ location, weather: { status: 'loading' }, country: { status: 'loading' }, currency: { status: 'loading' } })
    function update<K extends 'weather' | 'country' | 'currency'>(key: K, value: Destination[K]) {
      if (!signal.aborted) setDestination(current => current ? { ...current, [key]: value } : current)
    }
    async function settle<T>(action: () => Promise<T>, subject: string): Promise<Resource<T>> {
      try { return { status: 'success', data: await action() } }
      catch (reason) { return { status: 'error', message: errorMessage(reason, subject) } }
    }
    await Promise.all([
      settle(() => getWeather(location, signal), 'o clima').then(result => update('weather', result)),
      (async () => {
        const country = await settle(() => getCountry(location.countryCode, signal), 'o país')
        update('country', country)
        if (signal.aborted) return
        const currency = country.status === 'success'
          ? await settle(() => getCurrencyQuote(country.data.currency?.code, signal), 'o câmbio')
          : { status: 'error' as const, message: 'Câmbio indisponível: não foi possível identificar a moeda.' }
        update('currency', currency)
      })(),
    ])
  }
  async function search(city: string) {
    const signal = begin()
    setLoading(true)
    try {
      const results = await searchLocations(city, signal)
      if (signal.aborted) return
      if (results.length === 1) await load(results[0], signal)
      else { setMatches(results); setLoading(false) }
    } catch (reason) {
      if (!signal.aborted) { setError(errorMessage(reason, 'o destino')); setLoading(false) }
    }
  }
  async function select(location: Location) { await load(location, begin()) }
  return { destination, matches, loading, error, search, select }
}
