import { z } from 'zod'
import type { Location } from '../types/location'
import type { WeatherReport } from '../types/weather'
import { parseResponse, requestJson, ServiceError } from './httpClient'
export const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast'
const numbers = z.array(z.number().finite()).length(5)
const weatherDto = z.object({
  current: z.object({ temperature_2m: z.number().finite(), apparent_temperature: z.number().finite(),
    relative_humidity_2m: z.number().min(0).max(100), wind_speed_10m: z.number().nonnegative(),
    weather_code: z.number().int(), time: z.string().min(10) }),
  daily: z.object({ time: z.array(z.iso.date()).length(5), temperature_2m_min: numbers,
    temperature_2m_max: numbers, precipitation_probability_max: z.array(z.number().min(0).max(100).nullable()).length(5),
    weather_code: z.array(z.number().int()).length(5) }),
})
export function normalizeWeather(data: unknown): WeatherReport {
  const { current, daily } = parseResponse(weatherDto, data)
  if (new Set(daily.time).size !== 5 || daily.time.some((date, index) => daily.time.indexOf(date) !== index)) {
    throw new ServiceError('unexpected-response')
  }
  return {
    observedAt: current.time,
    current: { temperatureCelsius: current.temperature_2m, apparentTemperatureCelsius: current.apparent_temperature,
      relativeHumidityPercent: current.relative_humidity_2m, windSpeedKmh: current.wind_speed_10m, weatherCode: current.weather_code },
    daily: daily.time.map((date, index) => ({ date, minimumTemperatureCelsius: daily.temperature_2m_min[index],
      maximumTemperatureCelsius: daily.temperature_2m_max[index], precipitationProbabilityPercent: daily.precipitation_probability_max[index],
      weatherCode: daily.weather_code[index] })),
  }
}
export async function getWeather(location: Location, signal?: AbortSignal): Promise<WeatherReport> {
  const url = new URL(WEATHER_API_URL)
  url.search = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_probability_max,weather_code',
    timezone: location.timezone, forecast_days: '5', temperature_unit: 'celsius', wind_speed_unit: 'kmh',
  }).toString()
  return normalizeWeather(await requestJson(url, { signal }))
}
