import { type FormEvent, useState } from 'react'
import { normalizeCityInput } from '../../utils/validation'
interface SearchBarProps { onSearch: (city: string) => void; disabled?: boolean; initialValue?: string }
export function SearchBar({ onSearch, disabled = false, initialValue = '' }: SearchBarProps) {
  const [city, setCity] = useState(initialValue)
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = normalizeCityInput(city)
    if (query.length >= 2 && query.length <= 100) onSearch(query)
  }
  return <form className="search-bar" onSubmit={handleSubmit} role="search">
    <label className="sr-only" htmlFor="destination">Para onde você quer viajar?</label>
    <span className="search-symbol" aria-hidden="true">⌕</span>
    <input id="destination" type="search" value={city} onChange={event => setCity(event.target.value)}
      placeholder="Para onde você quer viajar?" autoComplete="off" minLength={2} maxLength={100} required disabled={disabled} />
    <button className="button primary" type="submit" disabled={disabled || city.trim().length < 2}>Pesquisar <span aria-hidden="true">↗</span></button>
  </form>
}
