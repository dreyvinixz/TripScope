import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'

const cards = [
  { city: 'Tokyo', region: 'Ásia / JP', image: '/images/tokyo.png' },
  { city: 'London', region: 'Europa / GB', image: '/images/london.png' },
  { city: 'Rio Grande', region: 'América do Sul / BR', image: '/images/rio-grande.png' },
  { city: 'Paris', region: 'Europa / FR', image: '/images/paris.png' },
  { city: 'New York', region: 'América do Norte / US', image: '/images/new-york.png' },
]

export function TravelGallery({ onSelectCity }: { onSelectCity: (city: string) => void }) {
  return <section id="destinos" className="travel-gallery no-print" aria-label="Destinos em destaque">
    <div className="gallery-heading"><p className="eyebrow">SINAIS DO MUNDO</p><h2>Alguns lugares já estão chamando.</h2><span>05 / 06</span></div>
    <div className="gallery-grid">
      {cards.map(card => <button className="gallery-card" key={card.city} onClick={() => onSelectCity(card.city)} style={{ backgroundImage: `url('${card.image}')` }}>
        <span className="gallery-wash" /><span className="gallery-copy"><small>{card.region}</small><strong>{card.city}</strong><span className="gallery-arrow" aria-hidden="true"><HugeiconsIcon icon={ArrowUpRight01Icon} size={22} strokeWidth={1.7} /></span></span>
      </button>)}
    </div>
  </section>
}
