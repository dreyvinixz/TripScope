import { useMemo, useState } from 'react'
import rawWorldMap from '@svg-maps/world'

const highlighted = new Set(['br', 'fr', 'gb', 'jp', 'us'])
const countryMeta: Record<string, { name: string; signal: string; city: string }> = {
  br: { name: 'Brasil', signal: 'Porta de entrada para a América do Sul', city: 'São Paulo' },
  fr: { name: 'França', signal: 'Arte, gastronomia e história', city: 'Paris' },
  gb: { name: 'Reino Unido', signal: 'Cidades criativas e cultura', city: 'London' },
  jp: { name: 'Japão', signal: 'Tecnologia, tradição e contraste', city: 'Tokyo' },
  us: { name: 'Estados Unidos', signal: 'Grandes cidades e horizontes abertos', city: 'New York' },
}

interface MapLocation { name: string; id: string; path: string }
interface WorldMapData { viewBox: string; locations: MapLocation[] }
const worldMap = rawWorldMap as unknown as WorldMapData

export function WorldMapExplorer({ onSelectCity }: { onSelectCity: (city: string) => void }) {
  const [selectedId, setSelectedId] = useState('jp')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const selected = countryMeta[selectedId]
  const locations = useMemo(() => worldMap.locations, [])
  const selectCountry = (location: MapLocation) => setSelectedId(location.id)

  return <section className="world-explorer no-print" aria-label="Mapa mundial interativo">
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
            onClick={() => selectCountry(location)}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectCountry(location) } }}
          />)}
        </svg>
      </div>
      <aside className="world-card">
        <p className="eyebrow">PAÍS SELECIONADO</p>
        <h3>{selected?.name ?? locations.find(item => item.id === selectedId)?.name}</h3>
        <p>{selected?.signal ?? 'Explore um novo ponto no mapa para descobrir possibilidades.'}</p>
        {selected && <button className="text-action" onClick={() => onSelectCity(selected.city)}>Explorar {selected.city} <span aria-hidden="true">↗</span></button>}
        <div className="map-countries" aria-label="Destinos sugeridos">
          {Object.entries(countryMeta).map(([id, meta]) => <button key={id} className={selectedId === id ? 'active' : ''} onClick={() => setSelectedId(id)} aria-pressed={selectedId === id}>{meta.name}</button>)}
        </div>
      </aside>
    </div>
  </section>
}
