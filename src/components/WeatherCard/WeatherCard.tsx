import type { WeatherReport } from '../../types/weather'
import { temperature } from '../../utils/formatters'
import { getWeatherCondition } from '../../utils/weatherCodes'
export function WeatherCard({ weather, unit }: { weather: WeatherReport; unit: 'C' | 'F' }) {
  const current = weather.current
  const condition = getWeatherCondition(current.weatherCode)
  return <>
    <div className="weather-main"><strong>{temperature(current.temperatureCelsius, unit)}</strong><span role="img" aria-label={condition.iconLabel}>{condition.icon}</span></div>
    <p>{condition.description}</p>
    <dl className="weather-details">
      <div><dt>Sensação</dt><dd>{temperature(current.apparentTemperatureCelsius, unit)}</dd></div>
      <div><dt>Umidade</dt><dd>{current.relativeHumidityPercent}%</dd></div>
      <div><dt>Vento</dt><dd>{current.windSpeedKmh} km/h</dd></div>
    </dl>
    <p className="source">Open-Meteo · observado em {weather.observedAt.replace('T', ' ')} (hora local)</p>
  </>
}
