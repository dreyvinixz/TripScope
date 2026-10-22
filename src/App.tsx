import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowUpRight01Icon, FavouriteIcon, Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons'
import { useDestination } from './hooks/useDestination'
import { Loading } from './components/Loading/Loading'
import { ErrorMessage } from './components/ErrorMessage/ErrorMessage'
import { Dashboard } from './components/Dashboard'
import { DestinationHeader } from './components/DestinationHeader/DestinationHeader'
import { favoritesSchema, historySchema, readStored, themeSchema, writeStored } from './utils/storage'
import type { Location } from './types/location'
import { normalizeCityInput } from './utils/validation'
import { LandingExperience } from './components/LandingExperience/LandingExperience'

const destinationRoutes: Record<string, string> = {
  paris: 'Paris',
  tokyo: 'Tokyo',
  london: 'London',
  'rio-grande': 'Rio Grande',
  'sao-paulo': 'São Paulo',
  'new-york': 'New York',
  franca: 'Paris',
  japao: 'Tokyo',
  'reino-unido': 'London',
  brasil: 'Rio Grande',
  'estados-unidos': 'New York',
}

function citySlug(city: string): string {
  return city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
}

function cityFromPath(): string {
  const slug = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase()
  return destinationRoutes[slug] ?? ''
}

const sharedCity = new URLSearchParams(window.location.search).get('city')?.slice(0, 100) ?? ''
const initialCity = sharedCity || cityFromPath()

function currentRouteCity(): string {
  return new URLSearchParams(window.location.search).get('city')?.slice(0, 100) || cityFromPath()
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    if (!document.execCommand('copy')) throw new Error('copy-failed')
  } finally { textarea.remove() }
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`brand-logo ${compact ? 'is-compact' : ''}`}>
    <img src="/images/logo.png" alt="TravelAI" onError={event => { event.currentTarget.hidden = true }} />
    <span className="brand-logo-fallback" aria-hidden="true">Travel<span>AI</span></span>
  </span>
}

export function App() {
  const { destination, matches, loading, error, search, select, reset } = useDestination()
  const [history, setHistory] = useState(() => readStored('travelai:history', historySchema, []))
  const [favorites, setFavorites] = useState(() => readStored('travelai:favorites', favoritesSchema, []))
  const [theme, setTheme] = useState(() => readStored('travelai:theme', themeSchema,
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [unit, setUnit] = useState<'C' | 'F'>('C')
  const [notice, setNotice] = useState('')
  const [routeCity, setRouteCity] = useState(initialCity)
  useEffect(() => { document.documentElement.dataset.theme = theme; writeStored('travelai:theme', theme) }, [theme])
  useEffect(() => {
    if (initialCity) void search(initialCity)
  }, [search])
  useEffect(() => {
    function handlePopState() {
      const city = currentRouteCity()
      setRouteCity(city)
      setNotice('')
      if (city) void search(city)
      else reset()
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [reset, search])
  function updateDestinationRoute(city: string) {
    const nextPath = `/${citySlug(city)}`
    if (window.location.pathname !== nextPath || window.location.search) {
      window.history.pushState({}, '', nextPath)
    }
    setRouteCity(city)
  }
  function findCity(query: string) {
    setNotice('')
    const city = normalizeCityInput(query)
    updateDestinationRoute(city)
    const next = [city, ...history.filter(item => item !== city)].slice(0, 8)
    setHistory(next); writeStored('travelai:history', next)
    void search(city)
  }
  function selectDestination(location: Location) {
    setNotice('')
    updateDestinationRoute(location.city)
    void select(location)
  }
  function toggleFavorite(location: Location) {
    const existing = favorites.some(item => item.id === location.id)
    const next = existing ? favorites.filter(item => item.id !== location.id) : [location, ...favorites].slice(0, 12)
    setFavorites(next); writeStored('travelai:favorites', next)
    setNotice(existing ? 'Destino removido dos favoritos.' : 'Destino salvo nos favoritos.')
  }
  async function share() {
    if (!destination) return
    const url = new URL(window.location.href)
    url.pathname = `/${citySlug(destination.location.city)}`
    url.search = ''
    try {
      if (navigator.share) await navigator.share({ title: `TravelAI · ${destination.location.city}`, url: url.toString() })
      else { await copyText(url.toString()); setNotice('Link copiado. A busca estará preenchida ao abrir.') }
    } catch { setNotice('Compartilhamento cancelado ou indisponível neste navegador.') }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main">Ir para o conteúdo</a>
    <header className="site-header no-print"><a href="/" className="brand" aria-label="TravelAI início"><BrandLogo /></a>
      <nav className="site-nav" aria-label="Navegação principal"><a href="/#atlas-vivo">Atlas Vivo</a><a href="/#destinos">Destinos</a></nav>
      <span className="header-caption">Seu próximo destino começa aqui.</span>
      <button className="button theme-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}><HugeiconsIcon icon={theme === 'light' ? Moon02Icon : Sun03Icon} size={20} strokeWidth={1.7} aria-hidden="true" /></button></header>
    <main id="main">
      <LandingExperience destination={destination} initialValue={routeCity} onSearch={findCity} onSelectLocation={selectDestination} />
      {(history.length > 0 || favorites.length > 0) && <section className="saved-searches no-print" aria-label="Destinos salvos">
        {history.length > 0 && <div><span>Recentes</span>{history.map(city => <button className="chip" key={city} onClick={() => findCity(city)}>{city}</button>)}</div>}
        {favorites.length > 0 && <div><span>Favoritos</span>{favorites.map(location => <button className="chip" key={location.id} onClick={() => selectDestination(location)}><HugeiconsIcon icon={FavouriteIcon} size={14} strokeWidth={1.7} aria-hidden="true" /> {location.city}</button>)}</div>}
      </section>}
      {loading && <Loading label="Buscando destino" />}
      {error && <ErrorMessage message={error} />}
      {matches.length > 0 && <section className="panel choices no-print" aria-label="Escolha seu destino"><h2>Qual destino você procura?</h2>
        <p className="muted">Encontramos lugares com nomes parecidos. Escolha o seu.</p>
        <ul>{matches.map(location => <li key={location.id}><button onClick={() => selectDestination(location)}><strong>{location.city}</strong><span>{[location.region, location.country].filter(Boolean).join(' · ')}</span><HugeiconsIcon icon={ArrowUpRight01Icon} size={17} strokeWidth={1.7} aria-hidden="true" /></button></li>)}</ul></section>}
      {notice && <p role="status" className="notice no-print">{notice}</p>}
      {destination ? <section className="destination" aria-label="Dashboard do destino" aria-labelledby="destination-title" key={destination.location.id}>
        <DestinationHeader location={destination.location} country={destination.country}
          isFavorite={favorites.some(item => item.id === destination.location.id)}
          unit={unit}
          onToggleFavorite={() => toggleFavorite(destination.location)} onShare={() => { void share() }}
          onToggleUnit={() => setUnit(unit === 'C' ? 'F' : 'C')} onRefresh={() => { void selectDestination(destination.location) }} />
        <Dashboard destination={destination} unit={unit} onRetry={() => selectDestination(destination.location)} />
      </section> : null}
    </main>
    <footer className="site-footer no-print">
      <div className="footer-main"><a href="/" className="brand" aria-label="TravelAI início"><BrandLogo compact /></a><div><p className="eyebrow">TRAVELAI / WORLDWIDE INTELLIGENCE</p><p>Descubra. Planeje. Viaje.</p></div></div>
      <div className="footer-links"><div><span>Explorar</span><a href="/#atlas-vivo">Atlas Vivo</a><a href="/#destinos">Destinos</a></div><div><span>Dados</span><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a><a href="https://restcountries.com/" target="_blank" rel="noreferrer">REST Countries</a><a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Frankfurter</a></div></div>
      <div className="footer-bottom"><span>Projeto acadêmico FURG</span><span>Clima · País · Moeda · Contexto</span></div>
    </footer>
  </div>
}
