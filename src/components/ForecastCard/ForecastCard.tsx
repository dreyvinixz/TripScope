import type { DailyForecast } from '../../types/weather'
import { formatDate, temperature } from '../../utils/formatters'
import { getWeatherDescription, getWeatherIcon } from '../../utils/weatherCodes'
export function ForecastCard({ forecast, unit }: { forecast: DailyForecast; unit: 'C' | 'F' }) {
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${forecast.date}T12:00:00Z`))
  return <article className="forecast-card" aria-label={`Previsão ${forecast.date}`}>
    <p className="weekday">{weekday}</p><time dateTime={forecast.date}>{formatDate(forecast.date)}</time>
    <span className="forecast-icon" aria-hidden="true">{getWeatherIcon(forecast.weatherCode)}</span>
    <strong>{temperature(forecast.maximumTemperatureCelsius, unit)}</strong>
    <span className="muted">Mín. {temperature(forecast.minimumTemperatureCelsius, unit)}</span>
    <small>{getWeatherDescription(forecast.weatherCode)}</small>
    <small>Chuva: {forecast.precipitationProbabilityPercent === null ? 'sem dados' : `${forecast.precipitationProbabilityPercent}%`}</small>
  </article>
}
