import { useCallback, useEffect, useRef, useState } from 'react'
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

const fallbackCurrencyByCountry: Record<string, string> = {
  BR: 'BRL', FR: 'EUR', GB: 'GBP', JP: 'JPY', US: 'USD',
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
  const begin = useCallback((): ActiveRequest => {
    controller.current?.abort()
    const active = new AbortController()
    controller.current = active
    const id = requestId.current + 1
    requestId.current = id
    setError(''); setMatches([]); setDestination(null)
    setLoading(true)
    return { id, signal: active.signal }
  }, [])
  const isCurrent = useCallback((request: ActiveRequest): boolean => {
    return request.id === requestId.current && !request.signal.aborted
  }, [])
  const load = useCallback(async (location: Location, request: ActiveRequest) => {
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
      // A moeda só pode ser buscada depois de descobrir o país, salvo os códigos conhecidos abaixo.
      (async () => {
        const countryPromise = settle(() => getCountry(location.countryCode, request.signal), 'o país')
        const knownCurrency = fallbackCurrencyByCountry[location.countryCode.toUpperCase()]
        const currencyPromise = knownCurrency
          ? settle(() => getCurrencyQuote(knownCurrency, request.signal), 'o câmbio')
          : countryPromise.then(country => {
            const currencyCode = country.status === 'success' ? country.data.currency?.code : undefined
            return currencyCode
              ? settle(() => getCurrencyQuote(currencyCode, request.signal), 'o câmbio')
              : { status: 'error' as const, message: 'Câmbio indisponível: não foi possível determinar a moeda deste destino.' }
          })
        const [country, currency] = await Promise.all([countryPromise, currencyPromise])
        update('country', country)
        if (!isCurrent(request)) return
        update('currency', currency)
      })(),
    ])
  }, [isCurrent])
  const search = useCallback(async (city: string) => {
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
  }, [begin, isCurrent, load])
  const select = useCallback(async (location: Location) => { await load(location, begin()) }, [begin, load])
  const reset = useCallback(() => {
    controller.current?.abort()
    requestId.current += 1
    setDestination(null); setMatches([]); setLoading(false); setError('')
  }, [])
  return { destination, matches, loading, error, search, select, reset }
}
