import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { Destination } from '../../types/destination'
import { SearchBar } from '../SearchBar/SearchBar'
import { InteractiveGlobe } from '../InteractiveGlobe/InteractiveGlobe'
import { WorldMapExplorer } from '../WorldMapExplorer/WorldMapExplorer'
import { TravelGallery } from '../TravelGallery/TravelGallery'

interface LandingExperienceProps {
  destination: Destination | null
  initialValue: string
  onSearch: (city: string) => void
}

export function LandingExperience({ destination, initialValue, onSearch }: LandingExperienceProps) {
  const rootRef = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => {
      const heroReveal = root.querySelectorAll('.hero-reveal')
      if (heroReveal.length > 0) gsap.fromTo(heroReveal, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out' })
      const galleryCards = root.parentElement?.querySelectorAll('.gallery-card')
      if (galleryCards && galleryCards.length > 0) gsap.fromTo(galleryCards, { opacity: 0, y: 36, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.1, delay: 0.45, ease: 'power3.out' })
    }, root)
    return () => context.revert()
  }, [])

  return <>
    <section ref={rootRef} className={`hero-stage no-print ${destination ? 'is-compact' : ''}`}>
      <div className="hero-stage-grid">
        <div className="hero-message">
          <p className="hero-kicker hero-reveal">TRAVELAI / WORLDWIDE INTELLIGENCE</p>
          <h1 className="hero-reveal">Descubra.<br /><span>Planeje.</span><br /><em>Viaje.</em></h1>
          <p className="hero-lede hero-reveal">O clima, a moeda e a inspiração que faltavam — reunidos em uma leitura viva do mundo.</p>
          <div className="hero-search hero-reveal"><SearchBar onSearch={onSearch} initialValue={initialValue} /></div>
          <div className="hero-suggestions hero-reveal"><span>comece por</span>{['Tokyo', 'Paris', 'Rio Grande'].map(city => <button key={city} onClick={() => onSearch(city)}>{city} <span aria-hidden="true">↗</span></button>)}</div>
        </div>
        {!destination && <div className="hero-visual hero-reveal">
          <InteractiveGlobe onSelectCity={onSearch} />
          <span className="visual-label visual-label-top">um planeta<br /><strong>em movimento</strong></span>
          <span className="visual-label visual-label-bottom">arraste · explore<br /><strong>encontre o próximo ponto</strong></span>
        </div>}
      </div>
      {!destination && <div className="hero-data-line hero-reveal"><span><b>196</b> países para descobrir</span><span><b>04</b> camadas de contexto</span><span><b>01</b> próxima história</span><span className="hero-scroll">scroll para continuar <i aria-hidden="true">↓</i></span></div>}
    </section>
    {!destination && <><WorldMapExplorer onSelectCity={onSearch} /><TravelGallery onSelectCity={onSearch} /></>}
  </>
}
