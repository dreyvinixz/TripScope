import { useEffect, useState } from 'react'
import { SearchBar } from './components/SearchBar/SearchBar'
import { useDestination } from './hooks/useDestination'
import { Loading } from './components/Loading/Loading'
import { ErrorMessage } from './components/ErrorMessage/ErrorMessage'
import { Dashboard } from './components/Dashboard'
import { DestinationHeader } from './components/DestinationHeader/DestinationHeader'
import { favoritesSchema, historySchema, readStored, themeSchema, writeStored } from './utils/storage'
import type { Location } from './types/location'
import { normalizeCityInput } from './utils/validation'

const sharedCity = new URLSearchParams(window.location.search).get('city')?.slice(0, 100) ?? ''
export function App() {
  const { destination, matches, loading, error, search, select } = useDestination()
  const [history, setHistory] = useState(() => readStored('travelai:history', historySchema, []))
  const [favorites, setFavorites] = useState(() => readStored('travelai:favorites', favoritesSchema, []))
  const [theme, setTheme] = useState(() => readStored('travelai:theme', themeSchema,
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [unit, setUnit] = useState<'C' | 'F'>('C')
  const [notice, setNotice] = useState('')
  useEffect(() => { document.documentElement.dataset.theme = theme; writeStored('travelai:theme', theme) }, [theme])
  function findCity(query: string) {
    setNotice('')
    const city = normalizeCityInput(query)
    const next = [city, ...history.filter(item => item !== city)].slice(0, 8)
    setHistory(next); writeStored('travelai:history', next)
    void search(city)
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
    url.search = new URLSearchParams({ city: destination.location.city }).toString()
    try {
      if (navigator.share) await navigator.share({ title: `TravelAI · ${destination.location.city}`, url: url.toString() })
      else { await navigator.clipboard.writeText(url.toString()); setNotice('Link copiado. A busca estará preenchida ao abrir.') }
    } catch { setNotice('Compartilhamento cancelado ou indisponível neste navegador.') }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main">Ir para o conteúdo</a>
    <header className="site-header no-print"><a href="/" className="brand" aria-label="TravelAI início"><span className="brand-mark" aria-hidden="true">↗</span>Travel<span>AI</span></a>
      <span className="header-caption">Seu próximo destino começa aqui.</span>
      <button className="button theme-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}>{theme === 'light' ? '◐' : '☀'}</button></header>
    <main id="main">
      <section className={`hero no-print ${destination ? 'compact' : ''}`}>
        <div className="hero-copy"><p className="eyebrow">MENOS DÚVIDAS. MAIS MUNDO.</p><h1>Descubra.<br />Planeje. <em>Viaje.</em></h1>
          <p className="hero-description">O clima, a moeda e a inspiração que faltavam.<br />Tudo para transformar um destino na sua próxima viagem.</p>
          <SearchBar onSearch={findCity} initialValue={sharedCity} />
          <div className="suggestions"><span>Que tal explorar</span>{['Tokyo', 'Paris', 'Rio Grande'].map(city => <button key={city} onClick={() => findCity(city)}>{city} ↗</button>)}</div>
        </div>
        {!destination && <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="globe"><span>35° N<br />139° E</span></div><div className="travel-tag top-tag">✦ Um mundo de possibilidades</div><div className="travel-tag bottom-tag">Sua próxima história<br /><strong>começa com um destino.</strong></div></div>}
      </section>
      {(history.length > 0 || favorites.length > 0) && <section className="saved-searches no-print" aria-label="Destinos salvos">
        {history.length > 0 && <div><span>Recentes</span>{history.map(city => <button className="chip" key={city} onClick={() => findCity(city)}>{city}</button>)}</div>}
        {favorites.length > 0 && <div><span>Favoritos</span>{favorites.map(location => <button className="chip" key={location.id} onClick={() => { setNotice(''); void select(location) }}>★ {location.city}</button>)}</div>}
      </section>}
      {loading && <Loading label="Buscando destino" />}
      {error && <ErrorMessage message={error} />}
      {matches.length > 0 && <section className="panel choices no-print" aria-label="Escolha seu destino"><h2>Qual destino você procura?</h2>
        <p className="muted">Encontramos lugares com nomes parecidos. Escolha o seu.</p>
        <ul>{matches.map(location => <li key={location.id}><button onClick={() => { void select(location) }}><strong>{location.city}</strong><span>{[location.region, location.country].filter(Boolean).join(' · ')}</span><span aria-hidden="true">↗</span></button></li>)}</ul></section>}
      {notice && <p role="status" className="notice no-print">{notice}</p>}
      {destination ? <section className="destination" aria-label="Dashboard do destino" aria-labelledby="destination-title" key={destination.location.id}>
        <DestinationHeader location={destination.location} country={destination.country}
          isFavorite={favorites.some(item => item.id === destination.location.id)}
          unit={unit}
          onToggleFavorite={() => toggleFavorite(destination.location)} onShare={() => { void share() }}
          onToggleUnit={() => setUnit(unit === 'C' ? 'F' : 'C')} onRefresh={() => { void select(destination.location) }} />
        <Dashboard destination={destination} unit={unit} />
      </section> : !loading && !error && matches.length === 0 && <section className="home-features no-print" aria-label="Como funciona">
        <article><span>01 / DESCUBRA</span><h2>O mundo, mais perto.</h2><p>Encontre uma cidade e conheça o destino antes de fazer as malas.</p></article>
        <article><span>02 / PREPARE-SE</span><h2>Os detalhes importam.</h2><p>Confira o clima, a previsão e quanto seu dinheiro vale por lá.</p></article>
        <article><span>03 / INSPIRE-SE</span><h2>Uma viagem só sua.</h2><p>Crie um roteiro com IA a partir dos seus interesses e orçamento.</p></article>
      </section>}
    </main>
    <footer className="site-footer no-print"><span className="brand">Travel<span>AI</span></span><p>Descubra. Planeje. Viaje.</p>
      <p>Dados: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · <a href="https://restcountries.com/" target="_blank" rel="noreferrer">REST Countries</a> · <a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Frankfurter</a><br />Planejamento: Google Gemini · Projeto acadêmico FURG</p></footer>
  </div>
}
