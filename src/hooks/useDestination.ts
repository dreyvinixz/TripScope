import { useEffect, useRef, useState } from 'react'
import type { Destination, Resource } from '../types/destination'
import type { Location } from '../types/location'
import { searchLocations } from '../services/geocodingService'
import { getWeather } from '../services/weatherService'
import { getCountry } from '../services/countryService'
import { getCurrencyQuote } from '../services/currencyService'
import { errorMessage } from '../services/httpClient'
import { normalizeCityInput } from '../utils/validation'

interface ActiveRequest {
  id: number
  signal: AbortSignal
}

export function useDestination() {
  const [destination, setDestination] = useState<Destination | null>(null)
  const [matches, setMatches] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const requestId = useRef(0)
  useEffect(() => () => {
    requestId.current += 1
    controller.current?.abort()
  }, [])
  function begin(): ActiveRequest {
    controller.current?.abort()
    const active = new AbortController()
    controller.current = active
    const id = requestId.current + 1
    requestId.current = id
    setError(''); setMatches([]); setDestination(null)
    setLoading(true)
    return { id, signal: active.signal }
  }
  function isCurrent(request: ActiveRequest): boolean {
    return request.id === requestId.current && !request.signal.aborted
  }
  async function load(location: Location, request: ActiveRequest) {
    if (!isCurrent(request)) return
    setLoading(false); setMatches([])
    setDestination({ location, weather: { status: 'loading' }, country: { status: 'loading' }, currency: { status: 'loading' } })
    function update<K extends 'weather' | 'country' | 'currency'>(key: K, value: Destination[K]) {
      if (isCurrent(request)) setDestination(current => current ? { ...current, [key]: value } : current)
    }
    async function settle<T>(action: () => Promise<T>, subject: string): Promise<Resource<T>> {
      try { return { status: 'success', data: await action() } }
      catch (reason) { return { status: 'error', message: errorMessage(reason, subject) } }
    }
    await Promise.all([
      settle(() => getWeather(location, request.signal), 'o clima').then(result => update('weather', result)),
      (async () => {
        const country = await settle(() => getCountry(location.countryCode, request.signal), 'o país')
        update('country', country)
        if (!isCurrent(request)) return
        const currency = country.status !== 'success'
          ? { status: 'error' as const, message: 'Câmbio indisponível: não foi possível identificar o país.' }
          : country.data.currency?.code
            ? await settle(() => getCurrencyQuote(country.data.currency?.code, request.signal), 'o câmbio')
            : { status: 'error' as const, message: 'Câmbio indisponível: este país não informa uma moeda compatível.' }
        update('currency', currency)
      })(),
    ])
  }
  async function search(city: string) {
    const normalizedCity = normalizeCityInput(city)
    const request = begin()
    if (normalizedCity.length < 2 || normalizedCity.length > 100) {
      setError('Não encontramos esse destino.')
      setLoading(false)
      return
    }
    try {
      const results = await searchLocations(normalizedCity, request.signal)
      if (!isCurrent(request)) return
      if (results.length === 1) await load(results[0], request)
      else { setMatches(results); setLoading(false) }
    } catch (reason) {
      if (isCurrent(request)) { setError(errorMessage(reason, 'o destino')); setLoading(false) }
    }
  }
  async function select(location: Location) { await load(location, begin()) }
  return { destination, matches, loading, error, search, select }
}
