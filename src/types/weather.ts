export interface CurrentWeather {
  temperatureCelsius: number
  apparentTemperatureCelsius: number
  relativeHumidityPercent: number
  windSpeedKmh: number
  weatherCode: number
}
export interface DailyForecast {
  date: string
  minimumTemperatureCelsius: number
  maximumTemperatureCelsius: number
  precipitationProbabilityPercent: number | null
  weatherCode: number
}
export interface WeatherReport {
  observedAt: string
  current: CurrentWeather
  daily: DailyForecast[]
}
