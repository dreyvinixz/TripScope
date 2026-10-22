import { type FormEvent, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon, Search01Icon } from '@hugeicons/core-free-icons'
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
    <HugeiconsIcon className="search-symbol" icon={Search01Icon} size={20} strokeWidth={1.7} aria-hidden="true" />
    <input id="destination" type="search" value={city} onChange={event => setCity(event.target.value)}
      placeholder="Para onde você quer viajar?" autoComplete="off" minLength={2} maxLength={100} required disabled={disabled} />
    <button className="button primary" type="submit" disabled={disabled || city.trim().length < 2}>Pesquisar <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={1.8} aria-hidden="true" /></button>
  </form>
}
