import { useEffect, useLayoutEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { gsap } from 'gsap'
import type { Destination } from '../../types/destination'
import { SearchBar } from '../SearchBar/SearchBar'
import { WorldMapExplorer } from '../WorldMapExplorer/WorldMapExplorer'
import { TravelGallery } from '../TravelGallery/TravelGallery'
import { TravelMotion } from '../TravelMotion/TravelMotion'

interface LandingExperienceProps {
  destination: Destination | null
  initialValue: string
  onSearch: (city: string) => void
}

export function LandingExperience({ destination, initialValue, onSearch }: LandingExperienceProps) {
  const rootRef = useRef<HTMLElement>(null)
  const hasDestinationRoute = Boolean(initialValue)
  useEffect(() => {
    const video = rootRef.current?.querySelector<HTMLVideoElement>('.hero-video')
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    video.muted = true
    const play = () => { void video.play().catch(() => undefined) }
    const syncPlayback = () => {
      if (document.visibilityState === 'visible') play()
      else video.pause()
    }
    play()
    document.addEventListener('visibilitychange', syncPlayback)
    return () => document.removeEventListener('visibilitychange', syncPlayback)
  }, [destination])
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      root.querySelector<HTMLVideoElement>('.hero-video')?.pause()
      return
    }
    const context = gsap.context(() => {
      const heroReveal = root.querySelectorAll('.hero-reveal')
      if (heroReveal.length > 0) gsap.fromTo(heroReveal, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out' })
      const galleryCards = root.parentElement?.querySelectorAll('.gallery-card')
      if (galleryCards && galleryCards.length > 0) gsap.fromTo(galleryCards, { opacity: 0, y: 36, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.1, delay: 0.45, ease: 'power3.out' })
    }, root)
    return () => context.revert()
  }, [])

  return <>
    {hasDestinationRoute ? <section className="destination-search no-print" aria-label="Pesquisar outro destino">
      <span>Explore outro lugar</span><SearchBar key={initialValue} onSearch={onSearch} initialValue={initialValue} />
    </section> : <section ref={rootRef} className="hero-stage no-print">
      <video className="hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="/assets/15838744-uhd_3840_1620_24fps.webm" type="video/webm" />
        <source src="/assets/15838744-uhd_3840_1620_24fps.mp4" type="video/mp4" />
      </video>
      <div className="hero-stage-grid">
        <div className="hero-message">
          <p className="hero-kicker hero-reveal">TRAVELAI / WORLDWIDE INTELLIGENCE</p>
          <h1 className="hero-reveal">Descubra.<br /><span>Planeje.</span><br /><em>Viaje.</em></h1>
          <p className="hero-lede hero-reveal">O clima, a moeda e a inspiração que faltavam — reunidos em uma leitura viva do mundo.</p>
          <div className="hero-search hero-reveal"><SearchBar onSearch={onSearch} initialValue={initialValue} /></div>
          <div className="hero-suggestions hero-reveal"><span>comece por</span>{['Tokyo', 'Paris', 'Rio Grande'].map(city => <button key={city} onClick={() => onSearch(city)}>{city} <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.7} aria-hidden="true" /></button>)}</div>
        </div>
      </div>
      {!destination && <div className="hero-data-line hero-reveal"><span><b>196</b> países para descobrir</span><span><b>04</b> camadas de contexto</span><span><b>01</b> próxima história</span><span className="hero-scroll">scroll para continuar <i aria-hidden="true">↓</i></span></div>}
    </section>}
    {!hasDestinationRoute && !destination && <><WorldMapExplorer onSelectCity={onSearch} /><TravelMotion onSelectCity={onSearch} /><TravelGallery onSelectCity={onSearch} /></>}
  </>
}
