import { useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import rawWorldMap from '@svg-maps/world'
import type { Location } from '../../types/location'
import { getCountry } from '../../services/countryService'
import { searchLocations } from '../../services/geocodingService'
import { ServiceError } from '../../services/httpClient'

const highlighted = new Set(['br', 'fr', 'gb', 'jp', 'us'])
const countryMeta: Record<string, { name: string; signal: string; city: string; video: string }> = {
  br: { name: 'Brasil', signal: 'Porta de entrada para a América do Sul', city: 'São Paulo', video: 'saopaulo' },
  fr: { name: 'França', signal: 'Arte, gastronomia e história', city: 'Paris', video: 'paris' },
  gb: { name: 'Reino Unido', signal: 'Cidades criativas e cultura', city: 'London', video: 'london' },
  jp: { name: 'Japão', signal: 'Tecnologia, tradição e contraste', city: 'Tokyo', video: 'tokyo' },
  us: { name: 'Estados Unidos', signal: 'Grandes cidades e horizontes abertos', city: 'New York', video: 'newyork' },
}

interface MapLocation { name: string; id: string; path: string }
interface WorldMapData { viewBox: string; locations: MapLocation[] }
const worldMap = rawWorldMap as unknown as WorldMapData

export function WorldMapExplorer({ onSelectLocation }: { onSelectLocation: (location: Location) => void }) {
  const [selectedId, setSelectedId] = useState('jp')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [exploring, setExploring] = useState(false)
  const [exploreError, setExploreError] = useState('')
  const requestId = useRef(0)
  const locations = useMemo(() => worldMap.locations, [])
  const selected = countryMeta[selectedId]
  const selectedName = selected?.name ?? locations.find(item => item.id === selectedId)?.name ?? 'País não identificado'
  const selectCountryId = (id: string) => {
    requestId.current += 1
    setExploring(false)
    setExploreError('')
    setSelectedId(id)
  }
  async function exploreSelectedCountry() {
    const currentRequest = ++requestId.current
    const countryCode = selectedId.toUpperCase()
    setExploring(true)
    setExploreError('')
    try {
      const city = selected?.city ?? (await getCountry(countryCode)).capital
      if (!city) throw new ServiceError('not-found')
      const results = await searchLocations(city, undefined, countryCode)
      const location = results.find(result => result.countryCode === countryCode)
      if (!location) throw new ServiceError('not-found')
      if (requestId.current === currentRequest) onSelectLocation(location)
    } catch {
      if (requestId.current === currentRequest) setExploreError(`Não foi possível localizar uma cidade em ${selectedName}.`)
    } finally {
      if (requestId.current === currentRequest) setExploring(false)
    }
  }

  return <section id="atlas-vivo" className="world-explorer no-print" aria-label="Mapa mundial interativo">
    <div className="world-heading">
      <div><p className="eyebrow">ATLAS VIVO</p><h2>Veja o mundo de outro ângulo.</h2></div>
      <p>Selecione um país, abra um destino e deixe os dados guiarem o próximo passo.</p>
    </div>
    <div className="world-grid">
      <div className="world-map-shell">
        <div className="map-toolbar"><span><i className="map-dot" /> destinos em destaque</span><span>{hoveredId ? locations.find(item => item.id === hoveredId)?.name : 'mova o cursor sobre o mapa'}</span></div>
        <svg className="world-map" viewBox={worldMap.viewBox} role="group" aria-label="Mapa político mundial">
          <rect width="1010" height="666" fill="transparent" />
          {locations.map(location => <path
            key={location.id}
            d={location.path}
            className={`${highlighted.has(location.id) ? 'is-highlighted' : ''} ${selectedId === location.id ? 'is-selected' : ''}`}
            tabIndex={highlighted.has(location.id) ? 0 : undefined}
            role={highlighted.has(location.id) ? 'button' : undefined}
            aria-label={highlighted.has(location.id) ? location.name : undefined}
            aria-pressed={highlighted.has(location.id) ? selectedId === location.id : undefined}
            onMouseEnter={() => setHoveredId(location.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(location.id)}
            onBlur={() => setHoveredId(null)}
            onClick={() => selectCountryId(location.id)}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCountryId(location.id) } }}
          />)}
        </svg>
      </div>
      <aside className="world-card">
        <p className="eyebrow">PAÍS SELECIONADO</p>
        <h3>{selectedName}</h3>
        <p>{selected?.signal ?? 'Este país está disponível no mapa. Pesquise uma cidade para abrir dados de clima, país e moeda.'}</p>
        <button className="text-action" onClick={() => void exploreSelectedCountry()} disabled={exploring}>
          {exploring ? 'Localizando destino…' : `Explorar ${selected?.city ?? `capital de ${selectedName}`}`}
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} strokeWidth={1.7} aria-hidden="true" />
        </button>
        {exploreError && <p className="world-explore-error" role="alert">{exploreError}</p>}
        {selected && <div className="world-card-video">
          <video key={selectedId} autoPlay muted loop playsInline preload="metadata" aria-label={`Vídeo de ${selected.city}`}>
            <source src={`/assets/videos/${selected.video}.webm`} type="video/webm" />
            <source src={`/assets/videos/${selected.video}.mp4`} type="video/mp4" />
          </video>
          <span>{selected.city}</span>
        </div>}
        <div className="map-countries" aria-label="Destinos sugeridos">
          {Object.entries(countryMeta).map(([id, meta]) => <button key={id} className={selectedId === id ? 'active' : ''} onClick={() => selectCountryId(id)} aria-pressed={selectedId === id}>{meta.name}</button>)}
        </div>
      </aside>
    </div>
  </section>
}
