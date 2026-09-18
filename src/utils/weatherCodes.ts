const conditions: [number[], string, string][] = [
  [[0], 'Céu limpo', '☀'], [[1], 'Predominantemente limpo', '☀'], [[2], 'Parcialmente nublado', '⛅'],
  [[3], 'Nublado', '☁'], [[45, 48], 'Neblina', '☁'], [[51, 53, 55], 'Garoa', '🌦'],
  [[56, 57], 'Garoa congelante', '❄'], [[61, 63, 65], 'Chuva', '🌧'], [[66, 67], 'Chuva congelante', '❄'],
  [[71, 73, 75, 77], 'Neve', '❄'], [[80, 81, 82], 'Pancadas de chuva', '🌧'],
  [[85, 86], 'Pancadas de neve', '❄'], [[95, 96, 99], 'Trovoada', '⛈'],
]
export interface WeatherCondition {
  description: string
  icon: string
  iconLabel: string
}

export function getWeatherCondition(code: number): WeatherCondition {
  const condition = conditions.find(([codes]) => codes.includes(code))
  if (!condition) return { description: 'Condição não identificada', icon: '◇', iconLabel: 'Condição meteorológica não identificada' }
  return { description: condition[1], icon: condition[2], iconLabel: `Ícone de ${condition[1].toLocaleLowerCase('pt-BR')}` }
}

export function getWeatherDescription(code: number): string { return getWeatherCondition(code).description }
export function getWeatherIcon(code: number): string { return getWeatherCondition(code).icon }
