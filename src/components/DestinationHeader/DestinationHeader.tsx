import { HugeiconsIcon } from '@hugeicons/react'
import { FavouriteIcon, RefreshIcon, Share01Icon } from '@hugeicons/core-free-icons'
import type { Resource } from '../../types/destination'
import type { Country } from '../../types/country'
import type { Location } from '../../types/location'

interface DestinationHeaderProps {
  location: Location
  country: Resource<Country>
  isFavorite: boolean
  unit: 'C' | 'F'
  onToggleFavorite: () => void
  onShare: () => void
  onToggleUnit: () => void
  onRefresh: () => void
}

export function DestinationHeader({ location, country, isFavorite, unit, onToggleFavorite, onShare, onToggleUnit, onRefresh }: DestinationHeaderProps) {
  const flagUrl = country.status === 'success' ? country.data.flagUrl : ''
  return <div className="destination-heading no-print">
    <div>
      <p className="eyebrow">SEU DESTINO, EM PERSPECTIVA</p>
      <h2 id="destination-title">
        {flagUrl && <img className="flag" src={flagUrl} alt={`Bandeira de ${location.country}`} width={36} height={24} />}
        {location.city}
      </h2>
      <p className="muted">{location.country} · {location.region} · {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°</p>
    </div>
    <div className="destination-actions">
      <button className="button secondary" aria-pressed={isFavorite} onClick={onToggleFavorite}><HugeiconsIcon icon={FavouriteIcon} size={16} strokeWidth={1.7} aria-hidden="true" /> Favoritar</button>
      <button className="button secondary" onClick={onShare}><HugeiconsIcon icon={Share01Icon} size={16} strokeWidth={1.7} aria-hidden="true" /> Compartilhar</button>
      <button className="button secondary" onClick={onToggleUnit} aria-label={`Alterar temperatura para °${unit === 'C' ? 'F' : 'C'}`}>°{unit} ⇄</button>
      <button className="button secondary" onClick={onRefresh}><HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={1.7} aria-hidden="true" /> Atualizar dados</button>
    </div>
  </div>
}
