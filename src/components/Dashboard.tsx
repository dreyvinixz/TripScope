import type { Destination } from '../types/destination'
import { WeatherCard } from './WeatherCard/WeatherCard'
import { ForecastCard } from './ForecastCard/ForecastCard'
import { CountryCard } from './CountryCard/CountryCard'
import { CurrencyConverter } from './CurrencyConverter/CurrencyConverter'
import { ResourcePanel } from './ResourcePanel'
import { TravelPlanner } from './TravelPlanner/TravelPlanner'
export function Dashboard({ destination, unit, onRetry }: { destination: Destination; unit: 'C' | 'F'; onRetry: () => void }) {
  return <>
    <div className="dashboard-grid no-print">
      <ResourcePanel title="Clima atual" resource={destination.weather} className="weather-panel" onRetry={onRetry}>{weather => <WeatherCard weather={weather} unit={unit} />}</ResourcePanel>
      <ResourcePanel title="Sobre o país" resource={destination.country} onRetry={onRetry}>{country => <CountryCard country={country} timezone={destination.location.timezone} />}</ResourcePanel>
      <ResourcePanel title="Seu dinheiro por lá" resource={destination.currency} onRetry={onRetry}>{quote => <CurrencyConverter quote={quote} />}</ResourcePanel>
    </div>
    <ResourcePanel title="Previsão de cinco dias · incluindo hoje" resource={destination.weather} className="forecast-panel no-print" onRetry={onRetry}>
      {weather => <><div className="forecast-grid">{weather.daily.map(day => <ForecastCard key={day.date} forecast={day} unit={unit} />)}</div><p className="source">Open-Meteo · datas no fuso {destination.location.timezone}</p></>}
    </ResourcePanel>
    <TravelPlanner destination={destination} />
  </>
}
