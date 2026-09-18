export const cities = {
  tokyo: {
    id: 1850147, name: 'Tokyo', latitude: 35.6895, longitude: 139.6917,
    country_code: 'JP', timezone: 'Asia/Tokyo', country: 'Japan', admin1: 'Tokyo',
  },
  london: {
    id: 2643743, name: 'London', latitude: 51.5072, longitude: -0.1276,
    country_code: 'GB', timezone: 'Europe/London', country: 'United Kingdom', admin1: 'England',
  },
  newYork: {
    id: 5128581, name: 'New York', latitude: 40.7128, longitude: -74.006,
    country_code: 'US', timezone: 'America/New_York', country: 'United States', admin1: 'New York',
  },
  paris: {
    id: 2988507, name: 'Paris', latitude: 48.8566, longitude: 2.3522,
    country_code: 'FR', timezone: 'Europe/Paris', country: 'France', admin1: 'Île-de-France',
  },
  rioGrande: {
    id: 3451190, name: 'Rio Grande', latitude: -32.0349, longitude: -52.0986,
    country_code: 'BR', timezone: 'America/Sao_Paulo', country: 'Brazil', admin1: 'Rio Grande do Sul',
  },
  saoPaulo: {
    id: 3448439, name: 'São Paulo', latitude: -23.5505, longitude: -46.6333,
    country_code: 'BR', timezone: 'America/Sao_Paulo', country: 'Brazil', admin1: 'São Paulo',
  },
  unsupported: {
    id: 9900001, name: 'Unsupported', latitude: 10, longitude: 20,
    country_code: 'XX', timezone: 'Etc/UTC', country: 'Exampleland', admin1: 'Example Region',
  },
  nowhere: {
    id: 9900002, name: 'Nowhere', latitude: -10, longitude: -20,
    country_code: 'EX', timezone: 'Etc/UTC', country: 'Exampleland', admin1: '',
  },
  longDestination: {
    id: 9900003, name: 'Very Long Destination Name For Accessibility', latitude: 1.2345, longitude: 2.3456,
    country_code: 'LL', timezone: 'Etc/UTC', country: 'A Country With A Deliberately Long Name', admin1: 'A Region With A Long Name',
  },
} as const

export const cityCases = [
  { query: 'Tokyo', location: cities.tokyo, country: 'Japan', currency: 'JPY' },
  { query: 'London', location: cities.london, country: 'United Kingdom', currency: 'GBP' },
  { query: 'New York', location: cities.newYork, country: 'United States', currency: 'USD' },
  { query: 'Paris', location: cities.paris, country: 'French Republic', currency: 'EUR' },
  { query: 'Rio Grande', location: cities.rioGrande, country: 'Brazil', currency: 'BRL' },
  { query: 'São Paulo', location: cities.saoPaulo, country: 'Brazil', currency: 'BRL' },
] as const

export function weatherPayload() {
  return {
    current: {
      time: '2026-09-18T14:00', temperature_2m: 24.5, apparent_temperature: 25.1,
      relative_humidity_2m: 68, wind_speed_10m: 12.4, weather_code: 2,
    },
    daily: {
      time: ['2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21', '2026-09-22'],
      temperature_2m_min: [19.1, 18.4, 20, 21.3, 19.8],
      temperature_2m_max: [26.4, 25.7, 27.2, 28, 24.9],
      precipitation_probability_max: [10, 35, null, 80, 45],
      weather_code: [2, 61, 3, 80, 95],
    },
  }
}

export function countryPayload(countryCode: string) {
  const countries: Record<string, { common: string; official: string; capital?: string[]; population: number; languages?: Record<string, string>; timezones?: string[]; currency?: { code: string; name: string; symbol: string }; flag: string }> = {
    JP: { common: 'Japan', official: 'Japan', capital: ['Tokyo'], population: 125124989, languages: { jpn: 'Japanese' }, timezones: ['UTC+09:00'], currency: { code: 'JPY', name: 'Japanese yen', symbol: '¥' }, flag: 'jp' },
    GB: { common: 'United Kingdom', official: 'United Kingdom of Great Britain and Northern Ireland', capital: ['London'], population: 67326569, languages: { eng: 'English' }, timezones: ['UTC'], currency: { code: 'GBP', name: 'Pound sterling', symbol: '£' }, flag: 'gb' },
    US: { common: 'United States', official: 'United States of America', capital: ['Washington, D.C.'], population: 331002651, languages: { eng: 'English' }, timezones: ['UTC-05:00'], currency: { code: 'USD', name: 'United States dollar', symbol: '$' }, flag: 'us' },
    FR: { common: 'France', official: 'French Republic', capital: ['Paris'], population: 68170228, languages: { fra: 'French' }, timezones: ['UTC+01:00'], currency: { code: 'EUR', name: 'Euro', symbol: '€' }, flag: 'fr' },
    BR: { common: 'Brazil', official: 'Federative Republic of Brazil', capital: ['Brasília'], population: 212559417, languages: { por: 'Portuguese' }, timezones: ['UTC-03:00'], currency: { code: 'BRL', name: 'Brazilian real', symbol: 'R$' }, flag: 'br' },
  }
  if (countryCode === 'XX') return [{ name: { common: 'Exampleland', official: 'Exampleland' }, cca2: 'XX', flags: { svg: 'https://flagcdn.com/xx.svg' }, capital: ['Example City'], population: 1000, languages: { exm: 'Examplean' }, timezones: ['UTC'], currencies: { XXX: { name: 'Example coin', symbol: '¤' } } }]
  if (countryCode === 'EX') return [{ name: { common: 'Exampleland', official: 'Exampleland' }, cca2: 'EX', population: 1000 }]
  if (countryCode === 'LL') return [{ name: { common: 'A Country With A Deliberately Long Name', official: 'The Official Republic Of A Country With A Deliberately Long Name' }, cca2: 'LL', capital: ['A Capital With A Deliberately Long Name'], population: 1234567, languages: { lng: 'A Language With A Deliberately Long Name' }, timezones: ['UTC'], currencies: { EUR: { name: 'Euro', symbol: '€' } } }]
  const country = countries[countryCode] ?? countries.JP
  return [{ name: { common: country.common, official: country.official }, cca2: countryCode, flags: { svg: `https://flagcdn.com/${country.flag}.svg` }, capital: country.capital, population: country.population, languages: country.languages, timezones: country.timezones, currencies: country.currency ? { [country.currency.code]: { name: country.currency.name, symbol: country.currency.symbol } } : undefined }]
}

export function currencyPayload(target: string) {
  const rates: Record<string, number> = { JPY: 29.42, EUR: 0.18, GBP: 0.21, USD: 0.19 }
  return { amount: 1, base: 'BRL', date: '2026-09-18', rates: { [target]: rates[target] ?? 1 } }
}

export function geminiPlanPayload(city = 'Tokyo') {
  return {
    summary: `Um roteiro curto e equilibrado para ${city}.`,
    days: [1, 2, 3].map(day => ({ day, morning: 'Passeio pela manhã.', afternoon: 'Atividade à tarde.', evening: 'Jantar à noite.' })),
    notes: ['Confirme horários antes de sair.'],
  }
}
