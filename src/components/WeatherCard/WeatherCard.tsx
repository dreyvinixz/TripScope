import type { WeatherReport } from '../../types/weather'
import { temperature } from '../../utils/formatters'
import { getWeatherDescription, getWeatherIcon } from '../../utils/weatherCodes'
export function WeatherCard({ weather, unit }: { weather: WeatherReport; unit: 'C' | 'F' }) {
  const current = weather.current
  return <>
    <div className="weather-main"><strong>{temperature(current.temperatureCelsius, unit)}</strong><span aria-hidden="true">{getWeatherIcon(current.weatherCode)}</span></div>
    <p>{getWeatherDescription(current.weatherCode)}</p>
    <dl className="weather-details">
      <div><dt>Sensação</dt><dd>{temperature(current.apparentTemperatureCelsius, unit)}</dd></div>
      <div><dt>Umidade</dt><dd>{current.relativeHumidityPercent}%</dd></div>
      <div><dt>Vento</dt><dd>{current.windSpeedKmh} km/h</dd></div>
    </dl>
    <p className="source">Open-Meteo · observado em {weather.observedAt.replace('T', ' ')} (hora local)</p>
  </>
}
