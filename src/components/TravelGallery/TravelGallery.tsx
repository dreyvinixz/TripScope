const cards = [
  { city: 'Tokyo', region: 'Ásia / JP', position: '8% 35%' },
  { city: 'London', region: 'Europa / GB', position: '36% 48%' },
  { city: 'Rio Grande', region: 'América do Sul / BR', position: '72% 75%' },
  { city: 'Paris', region: 'Europa / FR', position: '52% 27%' },
]

export function TravelGallery({ onSelectCity }: { onSelectCity: (city: string) => void }) {
  return <section className="travel-gallery no-print" aria-label="Destinos em destaque">
    <div className="gallery-heading"><p className="eyebrow">SINAIS DO MUNDO</p><h2>Alguns lugares já estão chamando.</h2><span>04 / 06</span></div>
    <div className="gallery-grid">
      {cards.map(card => <button className="gallery-card" key={card.city} onClick={() => onSelectCity(card.city)} style={{ backgroundImage: "url('/images/travel-montage.png')", backgroundPosition: card.position }}>
        <span className="gallery-wash" /><span className="gallery-copy"><small>{card.region}</small><strong>{card.city}</strong><i aria-hidden="true">↗</i></span>
      </button>)}
    </div>
  </section>
}
