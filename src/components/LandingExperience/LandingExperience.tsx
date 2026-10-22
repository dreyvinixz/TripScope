import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Destination } from '../../types/destination'
import type { Location } from '../../types/location'
import { SearchBar } from '../SearchBar/SearchBar'
import { WorldMapExplorer } from '../WorldMapExplorer/WorldMapExplorer'
import { TravelGallery } from '../TravelGallery/TravelGallery'
import { TravelMotion } from '../TravelMotion/TravelMotion'

gsap.registerPlugin(ScrollTrigger)

interface LandingExperienceProps {
  destination: Destination | null
  initialValue: string
  onSearch: (city: string) => void
  onSelectLocation: (location: Location) => void
}

export function LandingExperience({ destination, initialValue, onSearch, onSelectLocation }: LandingExperienceProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [videoNeedsPlay, setVideoNeedsPlay] = useState(false)
  const hasDestinationRoute = Boolean(initialValue)
  useEffect(() => {
    const video = rootRef.current?.querySelector<HTMLVideoElement>('.hero-video')
    if (!video) return
    video.muted = true
    let disposed = false
    const play = () => {
      if (disposed) return
      void video.play().then(() => {
        if (!disposed) setVideoNeedsPlay(false)
      }).catch(() => {
        if (!disposed) setVideoNeedsPlay(true)
      })
    }
    const handlePlaying = () => setVideoNeedsPlay(false)
    const handleError = () => setVideoNeedsPlay(true)
    const syncPlayback = () => {
      if (document.visibilityState === 'visible') play()
      else video.pause()
    }
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('error', handleError)
    video.addEventListener('canplay', play)
    rootRef.current?.querySelector<HTMLButtonElement>('.hero-video-toggle')?.addEventListener('click', play)
    play()
    document.addEventListener('visibilitychange', syncPlayback)
    return () => {
      disposed = true
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('error', handleError)
      video.removeEventListener('canplay', play)
      rootRef.current?.querySelector<HTMLButtonElement>('.hero-video-toggle')?.removeEventListener('click', play)
      document.removeEventListener('visibilitychange', syncPlayback)
    }
  }, [destination])
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const context = gsap.context(() => {
      const heroReveal = root.querySelectorAll('.hero-reveal')
      if (heroReveal.length > 0) gsap.fromTo(heroReveal, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: 'power3.out' })

      const heroTitleWords = root.querySelectorAll('.hero-title-word')
      if (heroTitleWords.length > 0) gsap.fromTo(heroTitleWords,
        { opacity: 0, y: 42, rotateX: -9, filter: 'blur(6px)', transformOrigin: '50% 100%' },
        { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)', duration: 0.95, stagger: 0.16, delay: 0.12, ease: 'power3.out' },
      )

      const heroVideo = root.querySelector('.hero-video')
      const heroMessage = root.querySelector('.hero-message')
      if (heroVideo && heroMessage) {
        const heroScroll = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
          },
        })
        heroScroll
          .to(heroVideo, { scale: 1.18, yPercent: 9, ease: 'none' }, 0)
          .to(heroMessage, { y: -72, opacity: 0.18, ease: 'none' }, 0)
          .to(heroTitleWords, { x: -20, scale: 0.97, stagger: 0.07, ease: 'none' }, 0)
      }

      const scrollSections = root.parentElement?.querySelectorAll<HTMLElement>('.world-explorer, .travel-motion, .travel-gallery')
      scrollSections?.forEach(section => {
        gsap.fromTo(section, { y: 44, opacity: 0.72 }, {
          y: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 88%',
            end: 'top 58%',
            scrub: 0.7,
          },
        })
      })

      const galleryCards = root.parentElement?.querySelectorAll('.gallery-card')
      if (galleryCards && galleryCards.length > 0) gsap.fromTo(galleryCards, { opacity: 0, y: 36, scale: 0.98 }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: galleryCards[0].parentElement,
          start: 'top 86%',
          once: true,
        },
      })
    }, root)
    const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      cancelAnimationFrame(refreshFrame)
      context.revert()
    }
  }, [])

  return <>
    {hasDestinationRoute ? <section className="destination-search no-print" aria-label="Pesquisar outro destino">
      <span>Explore outro lugar</span><SearchBar key={initialValue} onSearch={onSearch} initialValue={initialValue} />
    </section> : <section ref={rootRef} className="hero-stage no-print">
      <video className="hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="/assets/13241659_3240_2160_24fps.mp4" type="video/mp4" />
      </video>
      <button className="hero-video-toggle" type="button" hidden={!videoNeedsPlay}>
        Reproduzir vídeo
      </button>
      <div className="hero-stage-grid">
        <div className="hero-message">
          <p className="hero-kicker hero-reveal">TRAVELAI / WORLDWIDE INTELLIGENCE</p>
          <h1><span className="hero-title-word">Descubra.</span><span className="hero-title-word">Planeje.</span><em className="hero-title-word">Viaje.</em></h1>
          <p className="hero-lede hero-reveal">O clima, a moeda e a inspiração que faltavam — reunidos em uma leitura viva do mundo.</p>
          <div className="hero-search hero-reveal"><SearchBar onSearch={onSearch} initialValue={initialValue} /></div>
          <div className="hero-suggestions hero-reveal"><span>comece por</span>{['Tokyo', 'Paris', 'Rio Grande'].map(city => <button key={city} onClick={() => onSearch(city)}>{city} <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.7} aria-hidden="true" /></button>)}</div>
        </div>
      </div>
      {!destination && <div className="hero-data-line hero-reveal"><span><b>196</b> países para descobrir</span><span><b>04</b> camadas de contexto</span><span><b>01</b> próxima história</span><span className="hero-scroll">scroll para continuar <i aria-hidden="true">↓</i></span></div>}
    </section>}
    {!hasDestinationRoute && !destination && <><WorldMapExplorer onSelectLocation={onSelectLocation} /><TravelMotion onSelectCity={onSearch} /><TravelGallery onSelectCity={onSearch} /></>}
  </>
}
