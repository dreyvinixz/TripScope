import { expect, test, type Page, type Route } from '@playwright/test'

const tokyo = {
  id: 1850147, name: 'Tokyo', latitude: 35.6895, longitude: 139.6917,
  country_code: 'JP', timezone: 'Asia/Tokyo', country: 'Japan', admin1: 'Tokyo',
}
const paris = {
  id: 2988507, name: 'Paris', latitude: 48.8566, longitude: 2.3522,
  country_code: 'FR', timezone: 'Europe/Paris', country: 'France', admin1: 'Île-de-France',
}

function weatherPayload() {
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

function countryPayload(countryCode: string) {
  const isJapan = countryCode === 'JP'
  return [{
    name: { common: isJapan ? 'Japan' : 'France', official: isJapan ? 'Japan' : 'French Republic' },
    cca2: countryCode,
    flags: { svg: `https://flagcdn.com/${isJapan ? 'jp' : 'fr'}.svg` },
    capital: [isJapan ? 'Tokyo' : 'Paris'], population: isJapan ? 125124989 : 68170228,
    languages: { [isJapan ? 'jpn' : 'fra']: isJapan ? 'Japanese' : 'French' },
    timezones: [isJapan ? 'UTC+09:00' : 'UTC+01:00'],
    currencies: { [isJapan ? 'JPY' : 'EUR']: { name: isJapan ? 'Japanese yen' : 'Euro', symbol: isJapan ? '¥' : '€' } },
  }]
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
}

async function mockServices(page: Page, delayTokyo = false) {
  await page.route('**/geocoding-api.open-meteo.com/**', async (route) => {
    const name = new URL(route.request().url()).searchParams.get('name')
    if (delayTokyo && name === 'Tokyo') await new Promise(resolve => setTimeout(resolve, 300))
    await fulfillJson(route, { results: name === 'Tokyo' ? [tokyo] : name === 'Paris' ? [paris] : [] })
  })
  await page.route('**/api.open-meteo.com/v1/forecast**', route => fulfillJson(route, weatherPayload()))
  await page.route('**/restcountries.com/v3.1/alpha/**', async (route) => {
    const code = new URL(route.request().url()).pathname.split('/').pop() ?? 'JP'
    await fulfillJson(route, countryPayload(code))
  })
  await page.route('**/api.frankfurter.dev/v1/**', async (route) => {
    if (route.request().url().includes('/currencies')) return fulfillJson(route, { JPY: 'Japanese yen', EUR: 'Euro' })
    await fulfillJson(route, { amount: 1, base: 'BRL', date: '2026-09-18', rates: { JPY: 29.42, EUR: 0.18 } })
  })
}

function trackConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  return errors
}

test('pesquisa Tokyo e exibe destino, clima e cinco previsões', async ({ page }) => {
  const consoleErrors = trackConsoleErrors(page)
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')

  await expect(page.getByRole('heading', { name: 'Tokyo', exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Bandeira de Japan' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Clima atual' })).toContainText('25°C')
  await expect(page.getByRole('region', { name: 'Sobre o país' })).toContainText('Japanese')
  await expect(page.getByRole('region', { name: 'Seu dinheiro por lá' })).toContainText('JPY')
  await expect(page.getByRole('region', { name: 'Previsão de cinco dias · incluindo hoje' }).locator('.forecast-card')).toHaveCount(5)
  await expect(page.getByText('35.69°, 139.69°')).toBeVisible()
  expect(consoleErrors).toEqual([])
})

test('busca cidade inexistente e exibe erro amigável', async ({ page }) => {
  await mockServices(page)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('asdfghxyz123')
  await destination.press('Enter')

  await expect(page.getByRole('alert')).toContainText('Não encontramos esse destino.')
  await expect(page.getByRole('heading', { name: 'Descubra.' })).toBeVisible()
})

test('mantém somente Paris quando uma nova busca começa antes de Tokyo terminar', async ({ page }) => {
  await mockServices(page, true)
  await page.goto('/')

  const destination = page.getByRole('searchbox', { name: 'Para onde você quer viajar?' })
  await destination.fill('Tokyo')
  await destination.press('Enter')
  await destination.fill('Paris')
  await destination.press('Enter')

  await expect(page.getByRole('heading', { name: 'Paris', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tokyo', exact: true })).not.toBeVisible()
})
